import { createPgAuditLogStore } from '../infra/audit/pg-audit-log.store.js';
import { closeRedis, getRedis } from '../infra/cache/redis.js';
import { closePostgres, getPool } from '../infra/db/postgres.js';
import { PgTransactionManager } from '../infra/db/transaction-manager.js';
import { createInMemoryEventBus } from '../infra/events/event-bus.js';
import { createPgOutboxStore } from '../infra/events/outbox-store.js';
import { createPgIdempotencyStore } from '../infra/idempotency/pg-idempotency.store.js';
import { createNoopQueue } from '../infra/queue/noop-queue.js';
/**
 * Dependency Container.
 *
 * Single composition point for infrastructure adapters. The container is the
 * only place that *constructs* concrete infra (pg pool, redis client, event
 * bus, queue). Application code receives them as ports through `AppContext`.
 *
 * Lifecycle:
 *   - `createContainer(config)` builds and wires everything (cheap; no I/O).
 *   - `disposeContainer(container)` releases resources in reverse order and
 *     is idempotent (safe to call multiple times, e.g. from tests + signals).
 */
import type { AppContext } from './app-context.js';
import type { Config } from './config.js';

export interface Container extends AppContext {
  /** Releases every owned resource. Idempotent. */
  dispose(): Promise<void>;
}

export function createContainer(config: Config): Container {
  const pg = getPool();
  const redis = getRedis();
  const eventBus = createInMemoryEventBus();
  const queue = createNoopQueue();
  const tm = new PgTransactionManager(pg);
  const outbox = createPgOutboxStore({
    defaultRunner: () => tm.getCurrentRunner(),
  });
  const idempotency = createPgIdempotencyStore({
    defaultRunner: () => tm.getCurrentRunner(),
  });
  const auditLog = createPgAuditLogStore({
    defaultRunner: () => tm.getCurrentRunner(),
  });

  let disposed = false;
  const dispose = async (): Promise<void> => {
    if (disposed) return;
    disposed = true;
    // Reverse-order teardown: queue ← eventBus ← redis ← pg
    await queue.close().catch(() => undefined);
    await eventBus.close().catch(() => undefined);
    await closeRedis().catch(() => undefined);
    await closePostgres().catch(() => undefined);
  };

  return {
    config,
    pg,
    redis,
    eventBus,
    queue,
    tm,
    outbox,
    idempotency,
    auditLog,
    dispose,
  };
}

/** Convenience for callers that don't keep a reference to the container. */
export async function disposeContainer(container: Container): Promise<void> {
  await container.dispose();
}
