import type { Clock } from '../../../../shared/application/ports/clock.port.js';
/**
 * List Audit Logs use case.
 *
 * Clamps pagination, queries the repository, returns DTOs with the
 * redaction policy applied as a final gate.
 */
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import {
  AuditAccessPolicy,
  type AuditAccessSubject,
} from '../../domain/policies/audit-access.policy.js';
import type {
  AuditLogRepository,
  ListAuditLogsCriteria,
} from '../../domain/repositories/audit-log.repository.js';
import type { AuditLogListResultDto } from '../dto/audit-log.dto.js';
import type { ListAuditLogsQueryDto } from '../dto/list-audit-logs-query.dto.js';
import { AuditLogMapper } from '../mappers/audit-log.mapper.js';

export interface ListAuditLogsInput {
  readonly query: ListAuditLogsQueryDto;
  readonly subject: AuditAccessSubject;
}

export type ListAuditLogsError =
  | { kind: 'FORBIDDEN'; message: string }
  | { kind: 'INVALID_INPUT'; message: string };

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

function clamp(n: number | undefined, def: number, min: number, max: number): number {
  if (typeof n !== 'number' || !Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

export class ListAuditLogsUseCase {
  constructor(
    private readonly repo: AuditLogRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: ListAuditLogsInput,
  ): Promise<Ok<AuditLogListResultDto> | Err<ListAuditLogsError>> {
    if (!AuditAccessPolicy.canList(input.subject)) {
      return err({ kind: 'FORBIDDEN', message: 'Caller is not allowed to list audit logs' });
    }

    const limit = clamp(input.query.limit, DEFAULT_LIMIT, 1, MAX_LIMIT);
    const offset = Math.max(0, Math.floor(input.query.offset ?? 0));

    const criteria: ListAuditLogsCriteria = {
      limit,
      offset,
      ...(input.query.scope ? { scope: input.query.scope } : {}),
      ...(input.query.action ? { action: input.query.action } : {}),
    };
    const result = await this.repo.list(criteria);
    return ok({
      entries: result.entries.map((e) => AuditLogMapper.toDto(e)),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      retrievedAt: this.clock.now().toISOString(),
    });
  }
}
