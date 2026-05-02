/**
 * Percentage value object (0..100).
 *
 * Used in the sandbox mixing preview to describe distribution shares
 * between destination tokens. Not a financial instrument.
 */
import { ValueObject } from './value-object.js';

export interface PercentageProps extends Record<string, unknown> {
  readonly value: number;
}

export class Percentage extends ValueObject<PercentageProps> {
  static of(value: number): Percentage {
    if (!Number.isFinite(value)) throw new Error('Percentage must be finite');
    if (value < 0 || value > 100) throw new Error('Percentage must be in [0, 100]');
    return new Percentage({ value });
  }

  get value(): number {
    return this.props.value;
  }

  get ratio(): number {
    return this.props.value / 100;
  }
}
