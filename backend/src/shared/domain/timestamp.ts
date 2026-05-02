/**
 * Timestamp value object (ISO-8601).
 *
 * Keeps date parsing/formatting in one place. Pure: no I/O.
 */
import { ValueObject } from './value-object.js';

export interface TimestampProps extends Record<string, unknown> {
  readonly iso: string;
}

export class Timestamp extends ValueObject<TimestampProps> {
  static now(): Timestamp {
    return new Timestamp({ iso: new Date().toISOString() });
  }

  static fromDate(d: Date): Timestamp {
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) {
      throw new Error('Timestamp.fromDate: invalid Date');
    }
    return new Timestamp({ iso: d.toISOString() });
  }

  static fromIso(iso: string): Timestamp {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) throw new Error(`Timestamp.fromIso: invalid ISO: ${iso}`);
    return new Timestamp({ iso: d.toISOString() });
  }

  get iso(): string {
    return this.props.iso;
  }

  toDate(): Date {
    return new Date(this.props.iso);
  }

  isAfter(other: Timestamp): boolean {
    return this.toDate().getTime() > other.toDate().getTime();
  }
}
