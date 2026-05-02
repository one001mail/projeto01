/**
 * AuditLogEntry -> AuditLogDto mapping.
 *
 * Pure: no framework imports. Always runs the redaction policy as a
 * defence-in-depth layer before the row leaves the module.
 */
import type { AuditLogEntry } from '../../domain/entities/audit-log-entry.entity.js';
import { AuditRedactionPolicy } from '../../domain/policies/audit-redaction.policy.js';
import type { AuditLogDto } from '../dto/audit-log.dto.js';

export const AuditLogMapper = {
  toDto(entry: AuditLogEntry): AuditLogDto {
    return {
      id: entry.id,
      scope: entry.scope.toString(),
      action: entry.action.toString(),
      redactedPayload: AuditRedactionPolicy.apply(entry.redactedPayload),
      requestId: entry.requestId,
      actorId: entry.actorId,
      createdAt: entry.createdAt.toISOString(),
    };
  },
} as const;
