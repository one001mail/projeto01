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
import { closePostgres, getPool } from '../infra/db/postgres.js';
import { closeRedis, getRedis } from '../infra/cache/redis.js';
import { createInMemoryEventBus } from '../infra/events/event-bus.js';
import { createNoopQueue } from '../infra/queue/queue.port.js';

export interface Container extends AppContext {
  /** Releases every owned resource. Idempotent. */
  dispose(): Promise<void>;
}

export function createContainer(config: Config): Container {
  const pg = getPool();
  const redis = getRedis();
  const eventBus = createInMemoryEventBus();
  const queue = createNoopQueue();

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

  return { config, pg, redis, eventBus, queue, dispose };
}

/** Convenience for callers that don't keep a reference to the container. */
export async function disposeContainer(container: Container): Promise<void> {
  await container.dispose();
}
