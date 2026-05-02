/**
 * Outbox dispatcher (F4).
 *
 * Reads pending rows from an `OutboxStore` in FIFO order and publishes
 * them to the in-process `EventBus`. On success the row is marked
 * processed; on failure the row is marked failed — the store itself
 * handles attempt counting and escalation to the terminal 'failed' state
 * once `OUTBOX_MAX_ATTEMPTS` is reached.
 *
 * Scope:
 *   - One public operation: `tick(batchSize)` processes up to `batchSize`
 *     rows and returns per-tick stats. A periodic scheduler (see
 *     `scheduler-worker.ts`) invokes `tick()` at the configured interval.
 *   - The dispatcher does NOT own a timer or lifecycle; callers do.
 *   - Publishing is idempotent per-handler via the inbox guard that
 *     `register-event-handlers.ts` wraps around each subscription.
 *
 * Deliberately excluded:
 *   - Back-pressure on the event bus (in-memory, synchronous fan-out).
 *   - Cross-process locking — `listPending()` uses `FOR UPDATE SKIP LOCKED`
 *     in the PG store, and the in-memory store is single-process by design.
 */
import type { Logger } from '../../shared/application/ports/logger.port.js';
import type { DomainEvent } from './domain-event.js';
import type { EventBus } from './event-bus.js';
import type { OutboxRow, OutboxStore } from './outbox-store.js';

export interface OutboxDispatcherDeps {
  outbox: OutboxStore;
  eventBus: EventBus;
  logger?: Logger;
}

export interface OutboxTickStats {
  processed: number;
  failed: number;
  scanned: number;
}

export interface OutboxDispatcher {
  /** Drains up to `batchSize` pending rows. Safe to call concurrently only
   *  across distinct batches (the PG store uses SKIP LOCKED). */
  tick(batchSize: number): Promise<OutboxTickStats>;
}

export function createOutboxDispatcher(deps: OutboxDispatcherDeps): OutboxDispatcher {
  const { outbox, eventBus, logger } = deps;

  const toEvent = (row: OutboxRow): DomainEvent => ({
    id: row.id,
    name: row.event_name,
    occurredAt: row.created_at.toISOString(),
    payload: row.payload,
    ...(row.aggregate_id != null ? { aggregateId: row.aggregate_id } : {}),
  });

  return {
    async tick(batchSize: number): Promise<OutboxTickStats> {
      if (batchSize <= 0) return { processed: 0, failed: 0, scanned: 0 };

      const rows = await outbox.listPending(batchSize);
      let processed = 0;
      let failed = 0;

      for (const row of rows) {
        const event = toEvent(row);
        try {
          await eventBus.publish(event);
          await outbox.markProcessed(row.id);
          processed += 1;
        } catch (err) {
          failed += 1;
          const message = err instanceof Error ? err.message : String(err);
          try {
            await outbox.markFailed(row.id, message);
          } catch (markErr) {
            logger?.warn(
              { err: markErr, outboxId: row.id, eventName: row.event_name },
              'outbox.markFailed itself failed',
            );
          }
          logger?.warn(
            { err, outboxId: row.id, eventName: row.event_name, attempts: row.attempts + 1 },
            'outbox event dispatch failed',
          );
        }
      }

      return { processed, failed, scanned: rows.length };
    },
  };
}
