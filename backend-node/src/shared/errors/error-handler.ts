/**
 * Global error handler.
 *
 * Translates any thrown error into the stable JSON envelope:
 *   { error: { code, message, details?, requestId } }
 *
 * - `AppError`        → use its statusCode + code as-is.
 * - `ZodError`        → 422 with field-level details.
 * - Fastify validation→ 400 with field-level details.
 * - everything else   → 500 INTERNAL, message scrubbed in production.
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './app-error.js';
import { ErrorCode } from './error-codes.js';

interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    requestId: string;
  };
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setNotFoundHandler((req, reply) => {
    const body: ErrorEnvelope = {
      error: {
        code: ErrorCode.NOT_FOUND,
        message: `Route ${req.method} ${req.url} not found`,
        requestId: req.id,
      },
    };
    reply.code(404).send(body);
  });

  app.setErrorHandler((err: unknown, req: FastifyRequest, reply: FastifyReply) => {
    const requestId = req.id;

    // 1) AppError — our own contract
    if (err instanceof AppError) {
      req.log.warn(
        { err, code: err.code, statusCode: err.statusCode, details: err.details },
        'app error',
      );
      const body: ErrorEnvelope = {
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
          requestId,
        },
      };
      return reply.code(err.statusCode).send(body);
    }

    // 2) Zod — schema/parsing failure
    if (err instanceof ZodError) {
      req.log.info({ issues: err.issues }, 'validation error');
      const body: ErrorEnvelope = {
        error: {
          code: ErrorCode.VALIDATION_FAILED,
          message: 'Request validation failed',
          details: { issues: err.issues },
          requestId,
        },
      };
      return reply.code(422).send(body);
    }

    // 3) Fastify built-in validation
    const maybeFastify = err as { validation?: unknown; statusCode?: number; message?: string };
    if (maybeFastify.validation) {
      req.log.info({ err }, 'fastify validation error');
      const body: ErrorEnvelope = {
        error: {
          code: ErrorCode.BAD_REQUEST,
          message: maybeFastify.message ?? 'Bad request',
          details: { validation: maybeFastify.validation },
          requestId,
        },
      };
      return reply.code(maybeFastify.statusCode ?? 400).send(body);
    }

    // 4) Unknown — 5xx, scrub in production
    req.log.error({ err }, 'unhandled error');
    const isProd = process.env.NODE_ENV === 'production';
    const body: ErrorEnvelope = {
      error: {
        code: ErrorCode.INTERNAL,
        message: isProd
          ? 'Internal server error'
          : ((err as Error)?.message ?? 'Internal server error'),
        requestId,
      },
    };
    return reply.code(500).send(body);
  });
}
