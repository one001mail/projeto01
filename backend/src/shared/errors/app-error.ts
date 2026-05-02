/**
 * Application error model.
 *
 * Every error surfaced through the API extends `AppError`. The HTTP layer
 * inspects `statusCode` + `code` to render a stable JSON envelope, so the
 * client never sees raw stack traces or framework-specific messages.
 */
import { ErrorCode } from './error-codes.js';

export interface AppErrorOptions {
  code: ErrorCode;
  statusCode: number;
  message: string;
  details?: Record<string, unknown>;
  cause?: unknown;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details: Record<string, unknown> | undefined;
  public override readonly cause: unknown;

  constructor(opts: AppErrorOptions) {
    super(opts.message);
    this.name = 'AppError';
    this.code = opts.code;
    this.statusCode = opts.statusCode;
    this.details = opts.details;
    this.cause = opts.cause;
    Error.captureStackTrace?.(this, AppError);
  }

  static badRequest(message: string, details?: Record<string, unknown>): AppError {
    return new AppError({
      code: ErrorCode.BAD_REQUEST,
      statusCode: 400,
      message,
      ...(details ? { details } : {}),
    });
  }
  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError({ code: ErrorCode.UNAUTHORIZED, statusCode: 401, message });
  }
  static forbidden(message = 'Forbidden'): AppError {
    return new AppError({ code: ErrorCode.FORBIDDEN, statusCode: 403, message });
  }
  static notFound(message = 'Not found'): AppError {
    return new AppError({ code: ErrorCode.NOT_FOUND, statusCode: 404, message });
  }
  static conflict(message: string, details?: Record<string, unknown>): AppError {
    return new AppError({
      code: ErrorCode.CONFLICT,
      statusCode: 409,
      message,
      ...(details ? { details } : {}),
    });
  }
  static unprocessable(message: string, details?: Record<string, unknown>): AppError {
    return new AppError({
      code: ErrorCode.UNPROCESSABLE_ENTITY,
      statusCode: 422,
      message,
      ...(details ? { details } : {}),
    });
  }
  static rateLimited(message = 'Too many requests'): AppError {
    return new AppError({ code: ErrorCode.RATE_LIMITED, statusCode: 429, message });
  }
  static internal(message = 'Internal error', cause?: unknown): AppError {
    return new AppError({ code: ErrorCode.INTERNAL, statusCode: 500, message, cause });
  }
}
