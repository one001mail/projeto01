/**
 * No-op TransactionManager (sandbox-only fallback).
 *
 * Runs the callback with a runner that never touches a real database.
 * Used together with in-memory stores/repos when the container elects the
 * sandbox path (`SANDBOX_ONLY=true` + Postgres unreachable + not prod).
 *
 * Any query executed through this runner is a programming error in the
 * fallback topology: repositories must also be swapped for in-memory
 * implementations so they never reach the runner at all.
 */
import type {
  QueryResult,
  QueryRunner,
  TransactionManager,
  TransactionOptions,
} from '../../shared/application/ports/transaction-manager.port.js';

class NoopRunner implements QueryRunner {
  async query<T = unknown>(_sql: string, _params?: readonly unknown[]): Promise<QueryResult<T>> {
    throw new Error(
      'NoopTransactionManager: query() invoked in sandbox mode. ' +
        'Repositories must be in-memory when sandboxFallback=true.',
    );
  }
}

export class NoopTransactionManager implements TransactionManager {
  private readonly runner = new NoopRunner();

  async runInTransaction<T>(
    fn: (runner: QueryRunner) => Promise<T>,
    _options: TransactionOptions = {},
  ): Promise<T> {
    return fn(this.runner);
  }

  getCurrentRunner(): QueryRunner {
    return this.runner;
  }
}
