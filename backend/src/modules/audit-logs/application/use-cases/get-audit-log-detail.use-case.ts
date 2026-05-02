/**
 * Get Audit Log Detail use case.
 *
 * Looks up one row by id, applies access + redaction policies, returns DTO
 * or NOT_FOUND. Never echoes raw secrets.
 */
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import {
  AuditAccessPolicy,
  type AuditAccessSubject,
} from '../../domain/policies/audit-access.policy.js';
import type { AuditLogRepository } from '../../domain/repositories/audit-log.repository.js';
import type { AuditLogDto } from '../dto/audit-log.dto.js';
import { AuditLogMapper } from '../mappers/audit-log.mapper.js';

export interface GetAuditLogDetailInput {
  readonly id: string;
  readonly subject: AuditAccessSubject;
}

export type GetAuditLogDetailError =
  | { kind: 'FORBIDDEN'; message: string }
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'NOT_FOUND'; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class GetAuditLogDetailUseCase {
  constructor(private readonly repo: AuditLogRepository) {}

  async execute(
    input: GetAuditLogDetailInput,
  ): Promise<Ok<AuditLogDto> | Err<GetAuditLogDetailError>> {
    if (!AuditAccessPolicy.canRead(input.subject)) {
      return err({ kind: 'FORBIDDEN', message: 'Caller is not allowed to read audit logs' });
    }
    if (!UUID_RE.test(input.id)) {
      return err({ kind: 'INVALID_INPUT', message: 'audit-log id must be a uuid' });
    }
    const entry = await this.repo.getById(input.id);
    if (!entry) {
      return err({ kind: 'NOT_FOUND', message: `audit log '${input.id}' not found` });
    }
    return ok(AuditLogMapper.toDto(entry));
  }
}
