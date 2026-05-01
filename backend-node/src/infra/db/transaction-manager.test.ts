import type { Pool, PoolClient } from 'pg';
import { describe, expect, it } from 'vitest';
import { PgTransactionManager } from './transaction-manager.js';

/**
 * Minimal pg.Pool stub: tracks BEGIN/COMMIT/ROLLBACK and forwards queries to
 * a synthetic client. We don't need a real database to verify the manager's
 * AsyncLocalStorage wiring and rollback behaviour.
 */
function makeFakePool(): {
  pool: Pool;
  log: string[];
} {
  const log: string[] = [];
  const client = {
    query: async (sql: string) => {
      log.push(typeof sql === 'string' ? sql : '(non-string sql)');
      return { rows: [], rowCount: 0 };
    },
    release: () => log.push('RELEASE'),
  } as unknown as PoolClient;

  const pool = {
    connect: async () => client,
    query: async (sql: string) => {
      log.push(`POOL:${sql}`);
      return { rows: [], rowCount: 0 };
    },
  } as unknown as Pool;

  return { pool, log };
}

describe('PgTransactionManager', () => {
  it('runs fn inside BEGIN/COMMIT and exposes a runner via getCurrentRunner()', async () => {
    const { pool, log } = makeFakePool();
    const tm = new PgTransactionManager(pool);

    const result = await tm.runInTransaction(async (runner) => {
      // The runner is the same one ALS exposes inside the transaction
      const ambient = tm.getCurrentRunner();
      expect(ambient).toBe(runner);
      await runner.query('SELECT 42');
      return 'ok';
    });

    expect(result).toBe('ok');
    expect(log).toEqual(['BEGIN', 'SELECT 42', 'COMMIT', 'RELEASE']);
  });

  it('rolls back on thrown error and re-throws', async () => {
    const { pool, log } = makeFakePool();
    const tm = new PgTransactionManager(pool);

    await expect(
      tm.runInTransaction(async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrowError('boom');

    expect(log).toEqual(['BEGIN', 'ROLLBACK', 'RELEASE']);
  });

  it('outside a transaction, getCurrentRunner() returns a pool-backed runner', async () => {
    const { pool, log } = makeFakePool();
    const tm = new PgTransactionManager(pool);

    await tm.getCurrentRunner().query('SELECT 1');
    expect(log).toEqual(['POOL:SELECT 1']);
  });
});
