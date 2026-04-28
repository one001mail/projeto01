import type { FastifyBaseLogger } from 'fastify';
/**
 * PostgreSQL connection wrapper.
 *
 * Exposes a singleton `pg.Pool` and a `pingPostgres()` health probe.
 * The pool is created lazily so tests and the foundation phase don't require
 * a live DB. Repositories will import `getPool()` once they exist.
 */
import { Pool, type PoolConfig } from 'pg';
import { loadConfig } from '../../app/config.js';

let pool: Pool | undefined;

export function getPool(): Pool {
  if (pool) return pool;
  const config = loadConfig();

  const opts: PoolConfig = {
    connectionString: config.DATABASE_URL,
    max: config.PG_POOL_MAX,
    idleTimeoutMillis: config.PG_IDLE_TIMEOUT_MS,
    application_name: 'backend',
  };

  pool = new Pool(opts);
  pool.on('error', (err) => {
    // Keep this raw — the app logger may not be in scope here.
    // eslint-disable-next-line no-console
    console.error('postgres pool error', err);
  });
  return pool;
}

export async function pingPostgres(log: FastifyBaseLogger): Promise<'ok' | 'down' | 'skipped'> {
  try {
    const p = getPool();
    const client = await p.connect();
    try {
      await client.query('SELECT 1');
      return 'ok';
    } finally {
      client.release();
    }
  } catch (err) {
    log.warn({ err }, 'postgres ping failed');
    return 'down';
  }
}

export async function closePostgres(): Promise<void> {
  if (!pool) return;
  await pool.end();
  pool = undefined;
}
