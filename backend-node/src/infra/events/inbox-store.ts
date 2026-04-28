/**
 * Inbox store.
 *
 * Provides per-handler de-duplication for at-least-once delivery. Each
 * subscriber wraps its handler with `tryClaim(eventId, handlerName)`: the
 * first call inserts a row and returns true; subsequent calls hit the
 * UNIQUE(event_id, handler_name) constraint and return false, signalling a
 * duplicate that must be skipped.
 */
import type { QueryRunner } from '../../shared/application/ports/transaction-manager.port.js';

export interface InboxStore {
  /**
   * Atomically claim `(eventId, handlerName)`. Returns true if newly
   * claimed by this caller, false if it was already processed.
   */
  tryClaim(eventId: string, handlerName: string, runner?: QueryRunner): Promise<boolean>;
  /** Returns true if `(eventId, handlerName)` is already claimed. */
  hasProcessed(eventId: string, handlerName: string, runner?: QueryRunner): Promise<boolean>;
}

export interface PgInboxStoreDeps {
  defaultRunner: () => QueryRunner;
}

export function createPgInboxStore(deps: PgInboxStoreDeps): InboxStore {
  const pick = (r?: QueryRunner): QueryRunner => r ?? deps.defaultRunner();

  return {
    async tryClaim(eventId, handlerName, runner) {
      const r = pick(runner);
      const res = await r.query<{ id: string }>(
        `INSERT INTO inbox_events (event_id, handler_name)
         VALUES ($1, $2)
         ON CONFLICT (event_id, handler_name) DO NOTHING
         RETURNING id`,
        [eventId, handlerName],
      );
      return (res.rowCount ?? 0) > 0;
    },

    async hasProcessed(eventId, handlerName, runner) {
      const r = pick(runner);
      const res = await r.query<{ exists: boolean }>(
        `SELECT 1 AS exists
         FROM inbox_events
         WHERE event_id = $1 AND handler_name = $2
         LIMIT 1`,
        [eventId, handlerName],
      );
      return (res.rowCount ?? 0) > 0;
    },
  };
}
