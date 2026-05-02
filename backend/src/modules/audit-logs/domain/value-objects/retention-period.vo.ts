/**
 * RetentionPeriod value object.
 *
 * Number of days a scope retains its audit rows before cleanup.
 * Pure value object — no I/O.
 */
const MAX_DAYS = 365 * 5;

export class RetentionPeriod {
  private constructor(private readonly days: number) {}

  static ofDays(days: number): RetentionPeriod {
    if (!Number.isFinite(days) || !Number.isInteger(days)) {
      throw new Error('RetentionPeriod.days must be a finite integer');
    }
    if (days < 0) throw new Error('RetentionPeriod.days must be >= 0');
    if (days > MAX_DAYS) throw new Error(`RetentionPeriod.days must be <= ${MAX_DAYS}`);
    return new RetentionPeriod(days);
  }

  toDays(): number {
    return this.days;
  }

  /** Computes the cutoff `Date` relative to `now`: rows older than this MAY be removed. */
  cutoffFrom(now: Date): Date {
    return new Date(now.getTime() - this.days * 24 * 60 * 60 * 1000);
  }

  /** True when `0` — retention disabled. */
  isUnlimited(): boolean {
    return this.days === 0;
  }
}
