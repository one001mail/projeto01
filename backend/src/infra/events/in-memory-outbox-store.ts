/**
 * In-memory OutboxStore (sandbox-only fallback).
 *
 * Activated by the composition root ONLY when `SANDBOX_ONLY=true` and the
 * production Postgres connection is unreachable. Preserves the semantics of
 * `OutboxStore` — FIFO draining, attempt counting, and `attempts >= 5 =>
 * failed` escalation — without any durable storage.
 *
 * Must never be selected in `NODE_ENV=production`.
 */
import type { DomainEvent } from './domain-event.js';
import type { OutboxRow, OutboxStatus, OutboxStore } from './outbox-store.js';

interface Entry {
  id: string;
  event_name: string;
  aggregate_id: string | null;
  payload: unknown;
  status: OutboxStatus;
  attempts: number;
  last_error: string | null;
  created_at: Date;
  processed_at: Date | null;
  /** Monotonic insertion order to guarantee FIFO even when clocks collide. */
  seq: number;
}

export interface InMemoryOutboxStoreOptions {
  /** Attempts threshold that flips the status to 'failed'. Mirrors PG adapter. */
  maxAttempts?: number;
}

export interface InMemoryOutboxStore extends OutboxStore {
  /** Test/debug helper: snapshot of all entries (any status). */
  snapshot(): readonly OutboxRow[];
  /** Test/debug helper: drop every entry. */
  reset(): void;
}

export function createInMemoryOutboxStore(
  options: InMemoryOutboxStoreOptions = {},
): InMemoryOutboxStore {
  const maxAttempts = options.maxAttempts ?? 5;
  const entries = new Map<string, Entry>();
  let seq = 0;

  const toRow = (e: Entry): OutboxRow => ({
    id: e.id,
    event_name: e.event_name,
    aggregate_id: e.aggregate_id,
    payload: e.payload,
    status: e.status,
    attempts: e.attempts,
    last_error: e.last_error,
    created_at: e.created_at,
    processed_at: e.processed_at,
  });

  return {
    async save(event: DomainEvent): Promise<string> {
      const existing = entries.get(event.id);
      if (existing) return existing.id;
      const entry: Entry = {
        id: event.id,
        event_name: event.name,
        aggregate_id: event.aggregateId ?? null,
        payload: event.payload ?? {},
        status: 'pending',
        attempts: 0,
        last_error: null,
        created_at: new Date(event.occurredAt),
        processed_at: null,
        seq: seq++,
      };
      entries.set(entry.id, entry);
      return entry.id;
    },

    async listPending(limit: number): Promise<OutboxRow[]> {
      const pending: Entry[] = [];
      for (const entry of entries.values()) {
        if (entry.status === 'pending') pending.push(entry);
      }
      pending.sort((a, b) => a.seq - b.seq);
      return pending.slice(0, Math.max(0, limit)).map(toRow);
    },

    async markProcessed(id: string): Promise<void> {
      const entry = entries.get(id);
      if (!entry) return;
      entry.status = 'processed';
      entry.processed_at = new Date();
    },

    async markFailed(id: string, error: string): Promise<void> {
      const entry = entries.get(id);
      if (!entry) return;
      entry.attempts += 1;
      entry.last_error = error;
      entry.status = entry.attempts >= maxAttempts ? 'failed' : 'pending';
    },

    snapshot(): readonly OutboxRow[] {
      return Array.from(entries.values())
        .sort((a, b) => a.seq - b.seq)
        .map(toRow);
    },

    reset(): void {
      entries.clear();
      seq = 0;
    },
  };
}
