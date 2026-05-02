/**
 * In-memory `AuditLogRepository` for tests and sandbox runs that do not
 * provision Postgres. Stores already-redacted entries; never persists
 * across processes.
 */
import { AuditLogEntry } from '../../domain/entities/audit-log-entry.entity.js';
import type {
  AuditLogRepository,
  ListAuditLogsCriteria,
  ListAuditLogsResult,
} from '../../domain/repositories/audit-log.repository.js';

export interface InMemoryAuditLogRecordInput {
  readonly id: string;
  readonly scope: string;
  readonly action: string;
  readonly payload?: Record<string, unknown>;
  readonly requestId?: string | null;
  readonly actorId?: string | null;
  readonly createdAt: Date;
}

export class InMemoryAuditLogRepository implements AuditLogRepository {
  private rows: InMemoryAuditLogRecordInput[] = [];

  /** Test helper. */
  seed(rows: readonly InMemoryAuditLogRecordInput[]): void {
    this.rows = [...rows];
  }

  /** Production-shaped recording, used by tests that exercise the read API. */
  add(row: InMemoryAuditLogRecordInput): void {
    this.rows.push(row);
  }

  async list(criteria: ListAuditLogsCriteria): Promise<ListAuditLogsResult> {
    let filtered = this.rows;
    if (criteria.scope) filtered = filtered.filter((r) => r.scope === criteria.scope);
    if (criteria.action) filtered = filtered.filter((r) => r.action === criteria.action);
    const total = filtered.length;
    const sorted = [...filtered].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || (a.id < b.id ? 1 : -1),
    );
    const slice = sorted.slice(criteria.offset, criteria.offset + criteria.limit);
    return {
      entries: slice.map((r) =>
        AuditLogEntry.restore({
          id: r.id,
          scope: r.scope,
          action: r.action,
          redactedPayload: r.payload ?? {},
          requestId: r.requestId ?? null,
          actorId: r.actorId ?? null,
          createdAt: r.createdAt,
        }),
      ),
      total,
      limit: criteria.limit,
      offset: criteria.offset,
    };
  }

  async getById(id: string): Promise<AuditLogEntry | null> {
    const r = this.rows.find((x) => x.id === id);
    if (!r) return null;
    return AuditLogEntry.restore({
      id: r.id,
      scope: r.scope,
      action: r.action,
      redactedPayload: r.payload ?? {},
      requestId: r.requestId ?? null,
      actorId: r.actorId ?? null,
      createdAt: r.createdAt,
    });
  }

  async deleteOlderThan(cutoff: Date): Promise<number> {
    const before = this.rows.length;
    this.rows = this.rows.filter((r) => r.createdAt.getTime() >= cutoff.getTime());
    return before - this.rows.length;
  }

  /** Test helper. */
  reset(): void {
    this.rows = [];
  }

  /** Test helper. */
  size(): number {
    return this.rows.length;
  }
}
