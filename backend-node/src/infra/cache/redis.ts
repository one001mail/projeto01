import type { FastifyBaseLogger } from 'fastify';
/**
 * Redis connection wrapper.
 *
 * Lazy singleton client + a `pingRedis()` health probe. Configured to fail
 * fast (no infinite retries) so health checks accurately reflect availability.
 */
import { Redis } from 'ioredis';
import type { Redis as RedisClient } from 'ioredis';
import { loadConfig } from '../../app/config.js';

let client: RedisClient | undefined;

export function getRedis(): RedisClient {
  if (client) return client;
  const config = loadConfig();

  const c = new Redis(config.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 2_000,
    retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 200, 1_000)),
  });

  c.on('error', () => {
    /* swallow — surfaced via pingRedis() */
  });
  client = c;
  return c;
}

export async function pingRedis(log: FastifyBaseLogger): Promise<'ok' | 'down' | 'skipped'> {
  try {
    const c = getRedis();
    if (c.status === 'end' || c.status === 'wait') {
      await c.connect().catch(() => undefined);
    }
    const res = await c.ping();
    return res === 'PONG' ? 'ok' : 'down';
  } catch (err) {
    log.warn({ err }, 'redis ping failed');
    return 'down';
  }
}

export async function closeRedis(): Promise<void> {
  if (!client) return;
  client.disconnect();
  client = undefined;
}
