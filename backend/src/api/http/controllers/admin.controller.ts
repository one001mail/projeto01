/**
 * Admin controller.
 *
 * Surfaces operator endpoints that aggregate observable state without
 * touching domain logic. All admin reads go through use cases registered
 * by domain modules (`app.ctx.useCases.*`); no direct DB access lives here.
 */
import type { FastifyInstance } from 'fastify';
import type {
  AuditLogEntryDto,
  AuditLogsListDto,
  GeneratedTokenDto,
  ResourceReservationDto,
} from '../../../shared/application/ports/use-cases.port.js';

export interface AdminAuditLogsResult extends AuditLogsListDto {}

export type AdminDetailResult<T> =
  | { kind: 'ok'; value: T }
  | { kind: 'not-found' }
  | { kind: 'invalid'; message: string };

export interface AdminSubject {
  readonly actorId: string | null;
  readonly isAdmin: boolean;
}

/**
 * GET /api/admin/audit-logs
 *
 * Delegates to the `audit-logs` module use case. Returns DTOs that already
 * went through the redaction policy.
 */
export async function adminAuditLogsController(
  app: FastifyInstance,
  query: {
    limit?: number | undefined;
    offset?: number | undefined;
    scope?: string | undefined;
    action?: string | undefined;
  },
  subject: AdminSubject,
): Promise<AdminAuditLogsResult> {
  const uc = app.ctx.useCases.auditLogs?.list;
  if (!uc) {
    throw new Error('audit-logs module not registered');
  }
  const out = await uc.execute({ query, subject });
  if (!out.ok) {
    throw new Error(`audit-logs.list failed: ${out.error.kind}`);
  }
  return out.value;
}

/**
 * GET /api/admin/audit-logs/:id
 */
export async function adminAuditLogDetailController(
  app: FastifyInstance,
  input: { id: string },
  subject: AdminSubject,
): Promise<AdminDetailResult<AuditLogEntryDto>> {
  const uc = app.ctx.useCases.auditLogs?.getDetail;
  if (!uc) {
    throw new Error('audit-logs module not registered');
  }
  const out = await uc.execute({ id: input.id, subject });
  if (out.ok) return { kind: 'ok', value: out.value };
  if (out.error.kind === 'NOT_FOUND') return { kind: 'not-found' };
  if (out.error.kind === 'INVALID_INPUT') {
    return { kind: 'invalid', message: out.error.message };
  }
  throw new Error(`audit-logs.getDetail failed: ${out.error.kind}`);
}

/**
 * GET /api/admin/generated-tokens/:id
 */
export async function adminGeneratedTokenDetailController(
  app: FastifyInstance,
  input: { id: string },
): Promise<AdminDetailResult<GeneratedTokenDto>> {
  const uc = app.ctx.useCases.generatedTokens?.getMetadata;
  if (!uc) {
    throw new Error('generated-tokens module not registered');
  }
  const out = await uc.execute({ id: input.id });
  if (out.ok) return { kind: 'ok', value: out.value };
  if (out.error.kind === 'NOT_FOUND') return { kind: 'not-found' };
  if (out.error.kind === 'INVALID_INPUT') {
    return { kind: 'invalid', message: out.error.message };
  }
  throw new Error('generated-tokens.getMetadata: unreachable error kind');
}

/**
 * GET /api/admin/resource-reservations/:id
 */
export async function adminResourceReservationDetailController(
  app: FastifyInstance,
  input: { id: string },
): Promise<AdminDetailResult<ResourceReservationDto>> {
  const uc = app.ctx.useCases.resourceReservations?.getStatus;
  if (!uc) {
    throw new Error('resource-reservations module not registered');
  }
  const out = await uc.execute({ id: input.id });
  if (out.ok) return { kind: 'ok', value: out.value };
  if (out.error.kind === 'NOT_FOUND') return { kind: 'not-found' };
  if (out.error.kind === 'INVALID_INPUT') {
    return { kind: 'invalid', message: out.error.message };
  }
  throw new Error('resource-reservations.getStatus: unreachable error kind');
}
