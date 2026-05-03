/**
 * ApiError — unified error type for all HTTP interactions.
 *
 * The shared api layer normalizes every failure mode (network, timeout,
 * non-2xx response, invalid JSON) into an ApiError so callers never have to
 * disambiguate between `TypeError`, `DOMException`, Response, etc.
 */
export type ApiErrorKind =
  | "network"
  | "timeout"
  | "http"
  | "parse"
  | "aborted"
  | "unknown";

export interface ApiErrorOptions {
  kind: ApiErrorKind;
  status?: number;
  code?: string;
  details?: unknown;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, options: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.kind = options.kind;
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    if (options.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }

  /** True when the caller can reasonably retry the request. */
  get retriable(): boolean {
    if (this.kind === "network" || this.kind === "timeout") return true;
    if (this.kind === "http" && typeof this.status === "number") {
      return this.status >= 500 && this.status < 600;
    }
    return false;
  }
}

export const isApiError = (value: unknown): value is ApiError =>
  value instanceof ApiError;
