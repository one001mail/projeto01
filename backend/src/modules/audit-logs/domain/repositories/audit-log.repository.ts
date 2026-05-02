/**
 * AuditLogRepository PORT.
 *
 * Read- and lifecycle-only port. Recording lives in the cross-cutting
 * `audit-log` middleware via the shared `AuditLogStore` port; this
 * module is the consumer-side facade for admin queries and retention.
 */
import type { AuditLogEntry } from '../entities/audit-log-entry.entity.js';

export interface ListAuditLogsCriteria {
  readonly limit: number;
  readonly offset: number;
  readonly scope?: string;
  readonly action?: string;
}

export interface ListAuditLogsResult {
  readonly entries: readonly AuditLogEntry[];
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}

export interface AuditLogRepository {
  list(criteria: ListAuditLogsCriteria): Promise<ListAuditLogsResult>;
  getById(id: string): Promise<AuditLogEntry | null>;
  /** Removes rows whose `created_at < cutoff`. Returns the number of rows removed. */
  deleteOlderThan(cutoff: Date): Promise<number>;
}
