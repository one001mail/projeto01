/**
 * In-memory AuditLogStore.
 *
 * Used by tests and as a non-persistent fallback in dev. Records are kept
 * in insertion order and are inspectable via the `records` getter.
 */
import type {
  AuditLogEntry,
  AuditLogStore,
} from '../../shared/application/ports/audit-log.port.js';

export interface RecordedAuditEntry extends AuditLogEntry {
  readonly id: string;
  readonly createdAt: Date;
}

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

  /** Snapshot getter — callers must not mutate. */
  get records(): readonly RecordedAuditEntry[] {
    return this._records;
  }
}
