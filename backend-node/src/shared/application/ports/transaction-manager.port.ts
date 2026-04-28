/**
 * Transaction Manager port.
 *
 * Domain and application code never see `pg.Client`. They run database work
 * inside `runInTransaction(fn)` and receive a narrow `QueryRunner`. Stores
 * (repositories, outbox, inbox, idempotency) accept this `QueryRunner`
 * directly, or call `getCurrentRunner()` to pick up an ambient one set by
 * the surrounding transaction (via AsyncLocalStorage in the pg adapter).
 */
export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number | null;
}

export interface QueryRunner {
  query<T = unknown>(sql: string, params?: readonly unknown[]): Promise<QueryResult<T>>;
}

export interface TransactionOptions {
  /** PostgreSQL isolation level. Defaults to the database default. */
  isolation?: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  /** When true, opens a read-only transaction. */
  readOnly?: boolean;
}

export interface TransactionManager {
  /**
   * Run `fn` inside a database transaction. The runner passed to `fn`
   * scopes all queries to the transaction. Returning normally COMMITs;
   * throwing ROLLBACKs.
   */
  runInTransaction<T>(
    fn: (runner: QueryRunner) => Promise<T>,
    options?: TransactionOptions,
  ): Promise<T>;

  /**
   * Returns the runner of the surrounding transaction if one exists,
   * otherwise a runner that talks directly to the connection pool.
   */
  getCurrentRunner(): QueryRunner;
}
