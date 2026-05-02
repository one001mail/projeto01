/**
 * Admin-auth middleware (Fastify plugin).
 *
 * Gates everything registered inside the scope where it is mounted. The
 * canonical mount point is the `/api/admin` Fastify register block.
 *
 * Behaviour:
 *   * `Config.ADMIN_API_KEY` not configured (undefined / empty)
 *     -> 503 SERVICE_UNAVAILABLE. "Silent open mode" is forbidden by
 *        contract: missing config must fail closed.
 *   * Header `x-admin-api-key` missing or non-matching
 *     -> 401 UNAUTHORIZED.
 *   * Header `x-admin-api-key` matching the configured key (constant-time)
 *     -> request proceeds, `req.actorId = 'admin-api-key'` for audit.
 *
 * Sandbox-only contract:
 *   * No multi-tenant scopes, no key rotation, no key persistence.
 *   * The compared secret never leaves memory; never logged.
 */
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { compareApiKey } from '../../../infra/auth/api-key.admin-auth.js';
import { AppError } from '../../../shared/errors/app-error.js';

declare module 'fastify' {
  interface FastifyRequest {
    actorId?: string;
  }
}

const plugin: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', async (req: FastifyRequest, _reply: FastifyReply) => {
    const expected = app.ctx.config.ADMIN_API_KEY;
    if (!expected || expected.length === 0) {
      throw AppError.serviceUnavailable('Admin endpoint disabled: ADMIN_API_KEY is not configured');
    }

    const headerVal = req.headers['x-admin-api-key'];
    const provided = Array.isArray(headerVal) ? headerVal[0] : headerVal;

    if (!compareApiKey(provided, expected)) {
      throw AppError.unauthorized('Missing or invalid admin API key');
    }

    req.actorId = 'admin-api-key';
  });
};

export const adminAuthMiddleware = fp(plugin, { name: 'admin-auth-middleware' });
