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
import type { InboxStore } from '../infra/events/inbox-store.js';
import type { OutboxStore } from '../infra/events/outbox-store.js';
import type { AuditLogStore } from '../shared/application/ports/audit-log.port.js';
import type { EventBus } from '../shared/application/ports/event-bus.port.js';
import type { IdempotencyStore } from '../shared/application/ports/idempotency-store.port.js';
import type { QueuePort } from '../shared/application/ports/queue.port.js';
import type { TransactionManager } from '../shared/application/ports/transaction-manager.port.js';
import type { Config } from './config.js';

export interface AppContext {
  readonly config: Config;
  readonly pg: Pool;
  readonly redis: Redis;
  readonly eventBus: EventBus;
  readonly queue: QueuePort;
  readonly tm: TransactionManager;
  readonly outbox: OutboxStore;
  readonly inbox: InboxStore;
  readonly idempotency: IdempotencyStore;
  readonly auditLog: AuditLogStore;
  /**
   * True when the container elected the sandbox fallback path:
   * PG probe failed, `SANDBOX_ONLY=true`, and `NODE_ENV !== 'production'`.
   * Modules consult this to pick in-memory repositories.
   */
  readonly sandboxFallback: boolean;
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
