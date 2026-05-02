/**
 * Admin controller.
 *
 * Surfaces operator endpoints that aggregate observable state without
 * touching domain logic. All admin reads go through `app.ctx.auditLog`
 * and the dependency container; no direct DB access lives here.
 */
import type { FastifyInstance } from 'fastify';
import type {
  AuditLogListQuery,
  AuditLogListResult,
} from '../../../shared/application/ports/audit-log.port.js';

export interface AdminAuditLogsResult extends AuditLogListResult {
  readonly retrievedAt: string;
}

export async function adminAuditLogsController(
  app: FastifyInstance,
  query: AuditLogListQuery,
): Promise<AdminAuditLogsResult> {
  const result = await app.ctx.auditLog.list(query);
  return { ...result, retrievedAt: new Date().toISOString() };
}
