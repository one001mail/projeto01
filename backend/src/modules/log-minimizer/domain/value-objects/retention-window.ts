import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface RetentionWindowProps extends Record<string, unknown> {
  readonly days: number;
}
export class RetentionWindow extends ValueObject<RetentionWindowProps> {
  static ofDays(days: number): RetentionWindow {
    if (!Number.isInteger(days) || days < 0) throw new Error('days must be non-negative integer');
    return new RetentionWindow({ days });
  }
  get days(): number {
    return this.props.days;
  }
  cutoff(now: Date = new Date()): Date {
    return new Date(now.getTime() - this.props.days * 24 * 3600 * 1000);
  }
}
