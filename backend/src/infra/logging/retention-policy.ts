/**
 * Retention policy helpers.
 *
 * Pure: computes a cutoff date given a retention window in days. The
 * concrete cleanup runs through the audit-logs module's use case.
 */
export interface RetentionWindow {
  readonly days: number;
}

export function computeCutoff(window: RetentionWindow, now: Date = new Date()): Date {
  if (!Number.isFinite(window.days) || window.days < 0 || !Number.isInteger(window.days)) {
    throw new Error('RetentionWindow.days must be a non-negative integer');
  }
  return new Date(now.getTime() - window.days * 24 * 60 * 60 * 1000);
}
