import type { QueryRunner } from '../../shared/application/ports/transaction-manager.port.js';
/**
 * Outbox store.
 *
 * Persists domain events into `outbox_events` in the same transaction as the
 * producing aggregate. A future dispatcher (B3) reads pending rows in FIFO
 * order, publishes them to the in-process bus and downstream transports, and
 * marks rows as `processed`.
 *
 * The store accepts a `QueryRunner` so callers control the transaction
 * boundary explicitly. When called outside a transaction, the runner from
 * `TransactionManager.getCurrentRunner()` falls back to the connection pool.
 */
import type { DomainEvent } from './domain-event.js';

export type OutboxStatus = 'pending' | 'processed' | 'failed';

export interface OutboxRow {
  id: string;
  event_name: string;
  aggregate_id: string | null;
  payload: unknown;
  status: OutboxStatus;
  attempts: number;
  last_error: string | null;
  created_at: Date;
  processed_at: Date | null;
}

export interface OutboxStore {
  save(event: DomainEvent, runner?: QueryRunner): Promise<string>;
  listPending(limit: number, runner?: QueryRunner): Promise<OutboxRow[]>;
  markProcessed(id: string, runner?: QueryRunner): Promise<void>;
  markFailed(id: string, error: string, runner?: QueryRunner): Promise<void>;
}

export interface PgOutboxStoreDeps {
  /** Falls back to this runner when the caller does not pass one. */
  defaultRunner: () => QueryRunner;
}

export function createPgOutboxStore(deps: PgOutboxStoreDeps): OutboxStore {
  const pick = (r?: QueryRunner): QueryRunner => r ?? deps.defaultRunner();

  return {
    async save(event, runner) {
      const r = pick(runner);
      const res = await r.query<{ id: string }>(
        `INSERT INTO outbox_events (id, event_name, aggregate_id, payload, status, attempts, created_at)
         VALUES ($1, $2, $3, $4::jsonb, 'pending', 0, $5)
         RETURNING id`,
        [
          event.id,
          event.name,
          event.aggregateId ?? null,
          JSON.stringify(event.payload ?? {}),
          event.occurredAt,
        ],
      );
      return res.rows[0]?.id ?? event.id;
    },

    async listPending(limit, runner) {
      const r = pick(runner);
      const res = await r.query<OutboxRow>(
        `SELECT id, event_name, aggregate_id, payload, status, attempts, last_error, created_at, processed_at
         FROM outbox_events
         WHERE status = 'pending'
         ORDER BY created_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED`,
        [limit],
      );
      return res.rows;
    },

    async markProcessed(id, runner) {
      const r = pick(runner);
      await r.query(
        `UPDATE outbox_events
         SET status = 'processed', processed_at = now()
         WHERE id = $1`,
        [id],
      );
    },

    async markFailed(id, error, runner) {
      const r = pick(runner);
      await r.query(
        `UPDATE outbox_events
         SET attempts = attempts + 1,
             last_error = $2,
             status = CASE WHEN attempts + 1 >= 5 THEN 'failed' ELSE 'pending' END
         WHERE id = $1`,
        [id, error],
      );
    },
  };
}
