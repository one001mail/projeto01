/**
 * Request-context middleware.
 *
 * Attaches the per-request data that downstream handlers can read off of
 * `request.ctx`. This is distinct from the *application* context: it
 * captures things that only make sense for one request (id, start time,
 * idempotency key once B4 lands).
 *
 * Implemented as a Fastify plugin so it can be applied globally or per-scope.
 */
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

export interface RequestContext {
  readonly requestId: string;
  readonly startedAt: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    ctx: RequestContext;
  }
}

const plugin: FastifyPluginAsync = async (app) => {
  app.decorateRequest('ctx', null);
  app.addHook('onRequest', async (req: FastifyRequest) => {
    (req as { ctx: RequestContext }).ctx = {
      requestId: req.id,
      startedAt: Date.now(),
    };
  });
};

export const requestContextMiddleware = fp(plugin, { name: 'request-context' });
