/**
 * PostgreSQL Transaction Manager.
 *
 * Uses `AsyncLocalStorage` to expose the current transaction's client to any
 * code running inside `runInTransaction(fn)`. Repositories and stores import
 * `getCurrentRunner()` and don't need to know whether they are inside a
 * transaction or not.
 *
 * Usage:
 *   await tm.runInTransaction(async (runner) => {
 *     await orderRepo.save(order);          // uses runner via tm.getCurrentRunner()
 *     await outbox.save(domainEvent);       // same client, same transaction
 *   });
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Pool, PoolClient } from 'pg';
import type {
  QueryResult,
  QueryRunner,
  TransactionManager,
  TransactionOptions,
} from '../../shared/application/ports/transaction-manager.port.js';

function wrap(client: { query: PoolClient['query'] }): QueryRunner {
  return {
    async query<T = unknown>(sql: string, params?: readonly unknown[]): Promise<QueryResult<T>> {
      const r = await client.query(sql, params as unknown[] | undefined);
      return { rows: r.rows as T[], rowCount: r.rowCount };
    },
  };
}

export class PgTransactionManager implements TransactionManager {
  private readonly als = new AsyncLocalStorage<QueryRunner>();
  private readonly poolRunner: QueryRunner;

  constructor(private readonly pool: Pool) {
    this.poolRunner = wrap(pool);
  }

  getCurrentRunner(): QueryRunner {
    return this.als.getStore() ?? this.poolRunner;
  }

  async runInTransaction<T>(
    fn: (runner: QueryRunner) => Promise<T>,
    options: TransactionOptions = {},
  ): Promise<T> {
    // Nested call: reuse the outer transaction. (Real savepoint support can
    // be added later if module composition demands it.)
    const existing = this.als.getStore();
    if (existing) return fn(existing);

    const client = await this.pool.connect();
    try {
      const begin = ['BEGIN'];
      if (options.isolation) begin.push(`ISOLATION LEVEL ${options.isolation}`);
      if (options.readOnly) begin.push('READ ONLY');
      await client.query(begin.join(' '));

      const runner = wrap(client);
      try {
        const result = await this.als.run(runner, () => fn(runner));
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw err;
      }
    } finally {
      client.release();
    }
  }
}
