/**
 * PgAuditLogRepository.
 *
 * Reads `audit_logs` rows directly via the shared `TransactionManager`
 * runner. Implements the module's domain `AuditLogRepository` port.
 *
 * Writes are NOT exposed by this adapter — recording lives in the HTTP
 * `audit-log` middleware via the cross-cutting `AuditLogStore` port. This
 * keeps the module focused on read + lifecycle (cleanup) responsibilities.
 */
import type { TransactionManager } from '../../../../shared/application/ports/transaction-manager.port.js';
import { AuditLogEntry } from '../../domain/entities/audit-log-entry.entity.js';
import type {
  AuditLogRepository,
  ListAuditLogsCriteria,
  ListAuditLogsResult,
} from '../../domain/repositories/audit-log.repository.js';

interface AuditLogRow {
  id: string;
  scope: string;
  action: string;
  payload: Record<string, unknown> | null;
  request_id: string | null;
  actor_id: string | null;
  created_at: Date;
}

function rowToEntry(row: AuditLogRow): AuditLogEntry {
  return AuditLogEntry.restore({
    id: row.id,
    scope: row.scope,
    action: row.action,
    redactedPayload: row.payload ?? {},
    requestId: row.request_id,
    actorId: row.actor_id,
    createdAt: row.created_at,
  });
}

export function createPgAuditLogRepository(tm: TransactionManager): AuditLogRepository {
  return {
    async list(criteria: ListAuditLogsCriteria): Promise<ListAuditLogsResult> {
      const runner = tm.getCurrentRunner();
      const params: unknown[] = [];
      const where: string[] = [];
      if (criteria.scope) {
        params.push(criteria.scope);
        where.push(`scope = $${params.length}`);
      }
      if (criteria.action) {
        params.push(criteria.action);
        where.push(`action = $${params.length}`);
      }
      const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

      const totalRes = await runner.query<{ count: string }>(
        `SELECT count(*)::text as count FROM audit_logs ${whereSql}`,
        params,
      );
      const total = Number.parseInt(totalRes.rows[0]?.count ?? '0', 10);

      const limitParam = params.length + 1;
      const offsetParam = params.length + 2;
      const listRes = await runner.query<AuditLogRow>(
        `SELECT id, scope, action, payload, request_id, actor_id, created_at
         FROM audit_logs
         ${whereSql}
         ORDER BY created_at DESC, id DESC
         LIMIT $${limitParam} OFFSET $${offsetParam}`,
        [...params, criteria.limit, criteria.offset],
      );
      return {
        entries: listRes.rows.map(rowToEntry),
        total,
        limit: criteria.limit,
        offset: criteria.offset,
      };
    },

    async getById(id: string): Promise<AuditLogEntry | null> {
      const runner = tm.getCurrentRunner();
      const res = await runner.query<AuditLogRow>(
        `SELECT id, scope, action, payload, request_id, actor_id, created_at
         FROM audit_logs WHERE id = $1`,
        [id],
      );
      const row = res.rows[0];
      return row ? rowToEntry(row) : null;
    },

    async deleteOlderThan(cutoff: Date): Promise<number> {
      const runner = tm.getCurrentRunner();
      const res = await runner.query('DELETE FROM audit_logs WHERE created_at < $1', [cutoff]);
      return res.rowCount ?? 0;
    },
  };
}
