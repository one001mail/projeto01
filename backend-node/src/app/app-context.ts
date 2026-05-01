/**
 * Application Context.
 *
 * The `AppContext` is the typed, immutable bag of cross-cutting dependencies
 * that the application layer (controllers, modules, services) reads from.
 * It is built **once** by the dependency container and decorated onto the
 * Fastify instance, so any route/controller can resolve it via `app.ctx`.
 *
 * Rule of thumb: if a piece of state is needed by more than one module *and*
 * outlives a single request, it belongs here. Per-request data
 * (request id, user, idempotency key) belongs on `FastifyRequest`, not here.
 */
import type { FastifyInstance } from 'fastify';
import type { Redis } from 'ioredis';
import type { Pool } from 'pg';
import type { EventBus } from '../shared/application/ports/event-bus.port.js';
import type { QueuePort } from '../shared/application/ports/queue.port.js';
import type { Config } from './config.js';

export interface AppContext {
  readonly config: Config;
  readonly pg: Pool;
  readonly redis: Redis;
  readonly eventBus: EventBus;
  readonly queue: QueuePort;
}

declare module 'fastify' {
  interface FastifyInstance {
    /** Application-wide dependency context, attached during composition. */
    ctx: AppContext;
  }
}

/**
 * Decorate the Fastify instance with the context. Called once from
 * `build-app.ts` before any routes/modules are registered.
 */
export function attachAppContext(app: FastifyInstance, ctx: AppContext): void {
  if (app.hasDecorator('ctx')) {
    app.log.warn('AppContext already attached — skipping');
    return;
  }
  app.decorate('ctx', ctx);
}
