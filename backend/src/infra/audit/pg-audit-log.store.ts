/**
 * PostgreSQL AuditLogStore.
 *
 * Append-only insert into the `audit_logs` table (migration 006). The
 * middleware calls `record()` from `onResponse` (after the response has
 * been sent), so this MUST swallow infra errors: the request has already
 * succeeded for the caller and we cannot afford to throw.
 *
 * Reads (`list()`) are NOT swallowed — callers (admin endpoints) need a
 * truthful answer or a clear failure.
 */
import type {
  AuditLogEntry,
  AuditLogListQuery,
  AuditLogListResult,
  AuditLogRecord,
  AuditLogStore,
} from '../../shared/application/ports/audit-log.port.js';
import type { Logger } from '../../shared/application/ports/logger.port.js';
import type { QueryRunner } from '../../shared/application/ports/transaction-manager.port.js';

export interface PgAuditLogStoreDeps {
  defaultRunner: () => QueryRunner;
  logger?: Logger;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

interface AuditRow {
  id: string;
  scope: string;
  action: string;
  redacted_payload: Record<string, unknown> | null;
  request_id: string | null;
  actor_id: string | null;
  created_at: Date;
}

export function createPgAuditLogStore(deps: PgAuditLogStoreDeps): AuditLogStore {
  return {
    async record(entry: AuditLogEntry): Promise<void> {
      try {
        await deps.defaultRunner().query(
          'INSERT INTO audit_logs (scope, action, redacted_payload, request_id, actor_id) \
           VALUES ($1, $2, $3::jsonb, $4, $5)',
          [
            entry.scope,
            entry.action,
            JSON.stringify(entry.redactedPayload ?? {}),
            entry.requestId ?? null,
            entry.actorId ?? null,
          ],
        );
      } catch (err) {
        // Audit must NEVER break user-visible flow. Log + drop.
        deps.logger?.warn(
          {
            err,
            scope: entry.scope,
            action: entry.action,
            requestId: entry.requestId,
          },
          'audit-log persistence failed; entry dropped',
        );
      }
    },
    async list(query: AuditLogListQuery = {}): Promise<AuditLogListResult> {
      const limit = clamp(query.limit ?? DEFAULT_LIMIT, 1, MAX_LIMIT);
      const offset = Math.max(0, Math.floor(query.offset ?? 0));
      const filters: string[] = [];
      const params: unknown[] = [];
      if (query.scope) {
        params.push(query.scope);
        filters.push(`scope = $${params.length}`);
      }
      if (query.action) {
        params.push(query.action);
        filters.push(`action = $${params.length}`);
      }
      const where = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

      const runner = deps.defaultRunner();
      const totalRes = await runner.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM audit_logs ${where}`,
        params,
      );
      const total = Number(totalRes.rows[0]?.count ?? '0');

      params.push(limit);
      params.push(offset);
      const rowsRes = await runner.query<AuditRow>(
        `SELECT id, scope, action, redacted_payload, request_id, actor_id, created_at
         FROM audit_logs ${where}
         ORDER BY created_at DESC, id DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params,
      );
      const entries: AuditLogRecord[] = rowsRes.rows.map((r) => ({
        id: r.id,
        scope: r.scope,
        action: r.action,
        redactedPayload: r.redacted_payload ?? {},
        ...(r.request_id ? { requestId: r.request_id } : {}),
        ...(r.actor_id ? { actorId: r.actor_id } : {}),
        createdAt: new Date(r.created_at).toISOString(),
      }));
      return { entries, total, limit, offset };
    },
  };
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}
