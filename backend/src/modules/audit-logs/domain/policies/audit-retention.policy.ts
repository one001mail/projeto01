/**
 * AuditRetentionPolicy.
 *
 * Computes the cutoff date used by `cleanup-expired-audit-logs.use-case`.
 * Pure — no I/O. Reads no globals; takes the retention period and `now`
 * as parameters so callers stay testable.
 */
import type { RetentionPeriod } from '../value-objects/retention-period.vo.js';

export interface RetentionDecision {
  readonly cleanupEnabled: boolean;
  readonly cutoff: Date | null;
}

export const AuditRetentionPolicy = {
  decide(period: RetentionPeriod, now: Date): RetentionDecision {
    if (period.isUnlimited()) {
      return { cleanupEnabled: false, cutoff: null };
    }
    return { cleanupEnabled: true, cutoff: period.cutoffFrom(now) };
  },
} as const;
