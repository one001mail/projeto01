/**
 * `error` presenter.
 *
 * The global error handler (`api/http/error-handler.ts`) already produces
 * the canonical error envelope — this presenter exposes the same shape
 * for handlers that want to short-circuit a response WITHOUT throwing
 * (e.g. graceful degradation paths).
 *
 *   { error: { code, message, details?, requestId } }
 */
import { AppError } from '../../../shared/errors/app-error.js';
import type { ErrorCode } from '../../../shared/errors/error-codes.js';

export interface ErrorEnvelope {
  readonly error: {
    readonly code: ErrorCode;
    readonly message: string;
    readonly details?: Record<string, unknown>;
    readonly requestId: string;
  };
}

export function presentError(
  err: AppError | { code: ErrorCode; message: string; details?: Record<string, unknown> },
  requestId: string,
): ErrorEnvelope {
  if (err instanceof AppError) {
    return {
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
        requestId,
      },
    };
  }
  return {
    error: {
      code: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
      requestId,
    },
  };
}
