/**
 * In-memory AuditLogStore.
 *
 * Used by tests and as a non-persistent fallback in dev. Records are kept
 * in insertion order and are inspectable via the `records` getter.
 */
import type {
  AuditLogEntry,
  AuditLogListQuery,
  AuditLogListResult,
  AuditLogRecord,
  AuditLogStore,
} from '../../shared/application/ports/audit-log.port.js';

export interface RecordedAuditEntry extends AuditLogEntry {
  readonly id: string;
  readonly createdAt: Date;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

export class InMemoryAuditLogStore implements AuditLogStore {
  private readonly _records: RecordedAuditEntry[] = [];
  private counter = 0;

  async record(entry: AuditLogEntry): Promise<void> {
    this.counter += 1;
    this._records.push({
      ...entry,
      id: `audit-${this.counter.toString().padStart(6, '0')}`,
      createdAt: new Date(),
    });
  }

  async list(query: AuditLogListQuery = {}): Promise<AuditLogListResult> {
    const limit = clamp(query.limit ?? DEFAULT_LIMIT, 1, MAX_LIMIT);
    const offset = Math.max(0, Math.floor(query.offset ?? 0));
    const filtered = this._records.filter((r) => {
      if (query.scope && r.scope !== query.scope) return false;
      if (query.action && r.action !== query.action) return false;
      return true;
    });
    // Newest first.
    const sorted = [...filtered].reverse();
    const slice = sorted.slice(offset, offset + limit);
    const entries: AuditLogRecord[] = slice.map((r) => ({
      id: r.id,
      scope: r.scope,
      action: r.action,
      redactedPayload: r.redactedPayload,
      ...(r.requestId !== undefined ? { requestId: r.requestId } : {}),
      ...(r.actorId !== undefined ? { actorId: r.actorId } : {}),
      createdAt: r.createdAt.toISOString(),
    }));
    return { entries, total: filtered.length, limit, offset };
  }

  /** Snapshot getter — callers must not mutate. */
  get records(): readonly RecordedAuditEntry[] {
    return this._records;
  }
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}
