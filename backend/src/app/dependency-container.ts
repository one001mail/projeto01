import { InMemoryAuditLogStore } from '../infra/audit/in-memory-audit-log.store.js';
import { createPgAuditLogStore } from '../infra/audit/pg-audit-log.store.js';
import { closeRedis, getRedis } from '../infra/cache/redis.js';
import { closePostgres, getPool } from '../infra/db/postgres.js';
import { probePostgres } from '../infra/db/probe-postgres.js';
import { PgTransactionManager } from '../infra/db/transaction-manager.js';
import { createInMemoryEventBus } from '../infra/events/event-bus.js';
import { createInMemoryInboxStore } from '../infra/events/in-memory-inbox-store.js';
import { createInMemoryOutboxStore } from '../infra/events/in-memory-outbox-store.js';
import { type InboxStore, createPgInboxStore } from '../infra/events/inbox-store.js';
import { createPgOutboxStore } from '../infra/events/outbox-store.js';
import { InMemoryIdempotencyStore } from '../infra/idempotency/in-memory-idempotency.store.js';
import { createPgIdempotencyStore } from '../infra/idempotency/pg-idempotency.store.js';
import { createNoopQueue } from '../infra/queue/noop-queue.js';
import { createUseCaseRegistry } from '../shared/application/ports/use-cases.port.js';
/**
 * Dependency Container.
 *
 * Single composition point for infrastructure adapters. Concrete infra is
 * built here (pg pool, redis client, event bus, queue); application code
 * receives adapters as ports through `AppContext`.
 *
 * F4 — Strategy B:
 *   When `SANDBOX_ONLY=true` and `NODE_ENV !== 'production'`, the container
 *   probes Postgres at startup. If the probe fails, every PG-backed store
 *   (`outbox`, `inbox`, `idempotency`, `auditLog`) is swapped for its
 *   in-memory twin so the app stays usable in preview environments without
 *   a real database.
 *
 *   Production must never fall back: any PG outage in prod becomes a real
 *   startup failure instead of silently routing to volatile memory.
 *
 * Lifecycle:
 *   - `createContainer(config)` builds and wires everything (one async probe).
 *   - `disposeContainer(container)` releases resources in reverse order and
 *     is idempotent (safe to call multiple times, e.g. from tests + signals).
 */
import type { AppContext } from './app-context.js';
import type { Config } from './config.js';

export interface Container extends AppContext {
  /** True when the container bootstrapped on the in-memory fallback path. */
  readonly sandboxFallback: boolean;
  /** Inbox store shared with background workers (outbox dispatcher). */
  readonly inbox: InboxStore;
  /** Releases every owned resource. Idempotent. */
  dispose(): Promise<void>;
}

export async function createContainer(config: Config): Promise<Container> {
  const pg = getPool();
  const redis = getRedis();
  const eventBus = createInMemoryEventBus();
  const queue = createNoopQueue();
  const tm = new PgTransactionManager(pg);

  const canUseFallback = config.SANDBOX_ONLY && config.NODE_ENV !== 'production';
  const pgReachable = canUseFallback ? await probePostgres(pg) : true;
  const sandboxFallback = canUseFallback && !pgReachable;

  const outbox = sandboxFallback
    ? createInMemoryOutboxStore({ maxAttempts: config.OUTBOX_MAX_ATTEMPTS })
    : createPgOutboxStore({ defaultRunner: () => tm.getCurrentRunner() });

  const inbox: InboxStore = sandboxFallback
    ? createInMemoryInboxStore()
    : createPgInboxStore({ defaultRunner: () => tm.getCurrentRunner() });

  const idempotency = sandboxFallback
    ? new InMemoryIdempotencyStore()
    : createPgIdempotencyStore({ defaultRunner: () => tm.getCurrentRunner() });

  const auditLog = sandboxFallback
    ? new InMemoryAuditLogStore()
    : createPgAuditLogStore({ defaultRunner: () => tm.getCurrentRunner() });

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
    inbox,
    idempotency,
    auditLog,
    useCases: createUseCaseRegistry(),
    sandboxFallback,
    dispose,
  };
}

/** Convenience for callers that don't keep a reference to the container. */
export async function disposeContainer(container: Container): Promise<void> {
  await container.dispose();
}
