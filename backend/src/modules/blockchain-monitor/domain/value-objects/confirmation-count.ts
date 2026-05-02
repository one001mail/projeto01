import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface ConfirmationCountProps extends Record<string, unknown> {
  readonly value: number;
}

export class ConfirmationCount extends ValueObject<ConfirmationCountProps> {
  static of(value: number): ConfirmationCount {
    if (!Number.isInteger(value) || value < 0)
      throw new Error('ConfirmationCount must be non-negative integer');
    return new ConfirmationCount({ value });
  }
  get value(): number {
    return this.props.value;
  }
}
