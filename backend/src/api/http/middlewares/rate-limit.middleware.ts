/**
 * Rate-limit middleware (Fastify plugin).
 *
 * Wraps `@fastify/rate-limit` with project-aware defaults so individual
 * routes can tighten the global policy without re-deriving values from
 * `Config`. Use cases:
 *
 *   * Bursty mutating endpoints (POST /api/mix-sessions, POST /api/contact)
 *     register the middleware in their own `app.register(...)` scope to
 *     opt into a stricter quota than the global one.
 *   * Admin endpoints typically don't need a stricter quota — they sit
 *     behind the auth gate already.
 *
 * Behaviour:
 *   * If a `max`/`timeWindow` pair is provided, it overrides the global
 *     `Config.RATE_LIMIT_MAX` / `Config.RATE_LIMIT_WINDOW` for the scope.
 *   * The error response is shaped by the global error handler (HTTP 429,
 *     code `RATE_LIMITED`).
 */
import rateLimit, { type RateLimitOptions } from '@fastify/rate-limit';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { AppError } from '../../../shared/errors/app-error.js';

export interface RateLimitMiddlewareOptions extends RateLimitOptions {
  /**
   * Optional override for the multi-tier quota when the project gains
   * actual user identity. For now, the default keying strategy (IP) is
   * sufficient for the sandbox.
   */
  readonly scope?: string;
}

const plugin: FastifyPluginAsync<RateLimitMiddlewareOptions> = async (app, opts) => {
  const { scope: _scope, ...rateLimitOpts } = opts ?? {};
  await app.register(rateLimit, {
    ...rateLimitOpts,
    errorResponseBuilder: () => {
      throw AppError.rateLimited('Too many requests; please retry later');
    },
  });
};

export const rateLimitMiddleware = fp(plugin, { name: 'rate-limit-middleware' });
