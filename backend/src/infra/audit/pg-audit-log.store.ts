/**
 * PostgreSQL AuditLogStore.
 *
 * Append-only insert into the `audit_logs` table (migration 006). The
 * middleware calls `record()` from `onResponse` (after the response has
 * been sent), so this MUST swallow infra errors: the request has already
 * succeeded for the caller and we cannot afford to throw.
 */
import type {
  AuditLogEntry,
  AuditLogStore,
} from '../../shared/application/ports/audit-log.port.js';
import type { Logger } from '../../shared/application/ports/logger.port.js';
import type { QueryRunner } from '../../shared/application/ports/transaction-manager.port.js';

export interface PgAuditLogStoreDeps {
  defaultRunner: () => QueryRunner;
  logger?: Logger;
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
  };
}
