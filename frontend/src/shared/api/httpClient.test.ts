import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ApiError, isApiError } from "./ApiError";
import { httpClient } from "./httpClient";

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const emptyResponse = (status: number): Response =>
  new Response(null, { status });

describe("httpClient", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("parses a JSON success response", async () => {
    const mock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    globalThis.fetch = mock as unknown as typeof fetch;

    const data = await httpClient.get<{ ok: boolean }>("/api/ping");
    expect(data).toEqual({ ok: true });
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("serializes POST bodies as JSON and sets Content-Type", async () => {
    const mock = vi.fn().mockResolvedValue(jsonResponse(201, { id: "x" }));
    globalThis.fetch = mock as unknown as typeof fetch;

    await httpClient.post("/api/thing", { name: "hello" });

    const [, init] = mock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "hello" }));
    const headers = init.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("normalizes a non-2xx response into an ApiError with status and message", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(400, { message: "Invalid payload", error_code: "BAD" }),
      ) as unknown as typeof fetch;

    await expect(httpClient.post("/api/thing", {})).rejects.toMatchObject({
      name: "ApiError",
      kind: "http",
      status: 400,
      code: "BAD",
      message: "Invalid payload",
    });
  });

  it("does not retry non-idempotent POST on 500 by default", async () => {
    const mock = vi.fn().mockResolvedValue(emptyResponse(500));
    globalThis.fetch = mock as unknown as typeof fetch;

    const err = await httpClient.post("/api/thing", {}).catch((e) => e);
    expect(isApiError(err)).toBe(true);
    expect((err as ApiError).status).toBe(500);
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("retries idempotent GET on 500 up to default retries", async () => {
    const mock = vi
      .fn()
      .mockResolvedValueOnce(emptyResponse(500))
      .mockResolvedValueOnce(emptyResponse(503))
      .mockResolvedValueOnce(jsonResponse(200, { ok: 1 }));
    globalThis.fetch = mock as unknown as typeof fetch;

    const data = await httpClient.get<{ ok: number }>("/api/thing", {
      retryBackoffMs: 1,
    });
    expect(data).toEqual({ ok: 1 });
    expect(mock).toHaveBeenCalledTimes(3);
  });

  it("retries on network errors and eventually throws a network ApiError", async () => {
    const mock = vi
      .fn()
      .mockRejectedValue(new TypeError("Failed to fetch"));
    globalThis.fetch = mock as unknown as typeof fetch;

    const err = await httpClient
      .get("/api/thing", { retries: 2, retryBackoffMs: 1 })
      .catch((e) => e);

    expect(isApiError(err)).toBe(true);
    expect((err as ApiError).kind).toBe("network");
    expect(mock).toHaveBeenCalledTimes(3);
  });

  it("does not retry 4xx HTTP errors", async () => {
    const mock = vi.fn().mockResolvedValue(jsonResponse(404, { message: "nope" }));
    globalThis.fetch = mock as unknown as typeof fetch;

    const err = await httpClient.get("/api/thing", { retries: 3, retryBackoffMs: 1 }).catch((e) => e);
    expect((err as ApiError).status).toBe(404);
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it("appends query parameters safely", async () => {
    const mock = vi.fn().mockResolvedValue(jsonResponse(200, []));
    globalThis.fetch = mock as unknown as typeof fetch;

    await httpClient.get("/api/list", {
      query: { q: "hello world", skip: undefined, page: 2, active: true },
    });

    const [url] = mock.mock.calls[0] as [string];
    expect(url).toContain("/api/list?");
    expect(url).toContain("q=hello+world");
    expect(url).toContain("page=2");
    expect(url).toContain("active=true");
    expect(url).not.toContain("skip=");
  });
});
