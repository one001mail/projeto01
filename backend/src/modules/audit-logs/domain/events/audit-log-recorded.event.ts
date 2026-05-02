/**
 * Domain event emitted when an audit row is observed by the module's read
 * side. Pure type definitions; the infra layer is responsible for shaping
 * the canonical envelope.
 */
export const AUDIT_LOG_RECORDED_EVENT = 'audit-logs.recorded' as const;
export type AuditLogRecordedEventName = typeof AUDIT_LOG_RECORDED_EVENT;

export interface AuditLogRecordedPayload {
  readonly id: string;
  readonly scope: string;
  readonly action: string;
  readonly requestId: string | null;
  readonly actorId: string | null;
  readonly createdAt: string;
}
