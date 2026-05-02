/**
 * Emitted by `cleanup-expired-audit-logs.use-case` whenever the retention
 * sweep removes one or more rows. Pure type definitions.
 */
export const AUDIT_LOGS_CLEANED_EVENT = 'audit-logs.cleaned' as const;
export type AuditLogsCleanedEventName = typeof AUDIT_LOGS_CLEANED_EVENT;

export interface AuditLogsCleanedPayload {
  readonly removedCount: number;
  readonly cutoff: string;
  readonly retentionDays: number;
  readonly executedAt: string;
}
