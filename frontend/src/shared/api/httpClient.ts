/**
 * Typed fetch-based HTTP client.
 *
 * Responsibilities:
 *  - Resolve the API base URL from REACT_APP_BACKEND_URL (never hardcoded)
 *  - Serialize JSON request bodies; parse JSON response bodies
 *  - Normalize every failure into an ApiError (see ./ApiError.ts)
 *  - Honor per-call timeouts via AbortController
 *  - Retry idempotent (or opted-in) requests with exponential backoff on
 *    transient failures (network errors, timeouts, HTTP 5xx)
 *
 * UI code must never use fetch() directly — always go through this client,
 * preferably via a feature service that references endpoints.ts.
 */
import { ApiError } from "./ApiError";

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  body?: Json;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Per-request timeout in ms. Default 15_000. Set to 0 to disable. */
  timeoutMs?: number;
  /** Number of retry attempts for transient failures. Default depends on method. */
  retries?: number;
  /** Base backoff in ms (doubled each attempt). Default 200ms. */
  retryBackoffMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_BACKOFF_MS = 200;
const IDEMPOTENT_METHODS = new Set<HttpMethod>(["GET", "PUT", "DELETE"]);

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const getBaseUrl = (): string => {
  const raw =
    (import.meta.env?.REACT_APP_BACKEND_URL as string | undefined) ?? "";
  return raw.replace(/\/$/, "");
};

const buildUrl = (
  path: string,
  query?: RequestOptions["query"],
): string => {
  const base = getBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${normalized}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
};

const parseBody = async (res: Response): Promise<unknown> => {
  const text = await res.text();
  if (!text) return null;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch (cause) {
      throw new ApiError("Invalid JSON in response", {
        kind: "parse",
        status: res.status,
        cause,
      });
    }
  }
  return text;
};

const messageFromPayload = (payload: unknown, fallback: string): string => {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["message", "error", "detail"]) {
      const v = obj[key];
      if (typeof v === "string" && v.length > 0) return v;
    }
  }
  if (typeof payload === "string" && payload.length > 0) return payload;
  return fallback;
};

const codeFromPayload = (payload: unknown): string | undefined => {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["error_code", "code"]) {
      const v = obj[key];
      if (typeof v === "string" && v.length > 0) return v;
    }
  }
  return undefined;
};

const toApiError = (err: unknown, timedOut: boolean): ApiError => {
  if (err instanceof ApiError) return err;
  if (timedOut) {
    return new ApiError("Request timed out", { kind: "timeout", cause: err });
  }
  if (err instanceof DOMException && err.name === "AbortError") {
    return new ApiError("Request aborted", { kind: "aborted", cause: err });
  }
  const message = err instanceof Error ? err.message : "Network error";
  return new ApiError(message, { kind: "network", cause: err });
};

async function executeOnce<T>(
  path: string,
  method: HttpMethod,
  options: RequestOptions,
): Promise<T> {
  const url = buildUrl(path, options.query);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const externalSignal = options.signal;
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else
      externalSignal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
  }

  let timedOut = false;
  const timeout =
    timeoutMs > 0
      ? setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs)
      : null;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };
  let body: string | undefined;
  if (options.body !== undefined && method !== "GET") {
    body = JSON.stringify(options.body);
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
  } catch (err) {
    throw toApiError(err, timedOut);
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  const payload = await parseBody(res);

  if (!res.ok) {
    throw new ApiError(
      messageFromPayload(payload, `HTTP ${res.status}`),
      {
        kind: "http",
        status: res.status,
        code: codeFromPayload(payload),
        details: payload,
      },
    );
  }

  return payload as T;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method: HttpMethod = options.method ?? "GET";
  const maxRetries =
    options.retries ?? (IDEMPOTENT_METHODS.has(method) ? 2 : 0);
  const backoff = options.retryBackoffMs ?? DEFAULT_BACKOFF_MS;

  let attempt = 0;
  let lastError: ApiError | undefined;

  while (attempt <= maxRetries) {
    try {
      return await executeOnce<T>(path, method, options);
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : toApiError(err, false);
      lastError = apiErr;
      const canRetry = apiErr.retriable && attempt < maxRetries;
      if (!canRetry) throw apiErr;
      await sleep(backoff * 2 ** attempt);
      attempt += 1;
    }
  }

  // Unreachable; guard to satisfy TS.
  throw (
    lastError ??
    new ApiError("Request failed", { kind: "unknown" })
  );
}

export const httpClient = {
  get: <T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(
    path: string,
    body?: Json,
    options: Omit<RequestOptions, "method" | "body"> = {},
  ) => request<T>(path, { ...options, method: "POST", body }),
  put: <T>(
    path: string,
    body?: Json,
    options: Omit<RequestOptions, "method" | "body"> = {},
  ) => request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(
    path: string,
    body?: Json,
    options: Omit<RequestOptions, "method" | "body"> = {},
  ) => request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(
    path: string,
    options: Omit<RequestOptions, "method" | "body"> = {},
  ) => request<T>(path, { ...options, method: "DELETE" }),
  request,
} as const;

export type HttpClient = typeof httpClient;
