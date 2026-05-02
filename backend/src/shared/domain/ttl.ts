/**
 * Time-to-live (TTL) value object.
 *
 * Expresses a non-negative duration in seconds, with a helper to compute
 * an expiry `Date` from a base instant. Pure.
 */
import { ValueObject } from './value-object.js';

export interface TtlProps extends Record<string, unknown> {
  readonly seconds: number;
}

export class Ttl extends ValueObject<TtlProps> {
  static ofSeconds(seconds: number): Ttl {
    if (!Number.isFinite(seconds) || seconds < 0 || !Number.isInteger(seconds)) {
      throw new Error('Ttl.seconds must be a non-negative integer');
    }
    return new Ttl({ seconds });
  }

  get seconds(): number {
    return this.props.seconds;
  }

  expiryFrom(base: Date): Date {
    return new Date(base.getTime() + this.props.seconds * 1000);
  }
}
