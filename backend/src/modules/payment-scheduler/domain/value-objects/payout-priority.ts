import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface PayoutPriorityProps extends Record<string, unknown> {
  readonly value: number;
}
export class PayoutPriority extends ValueObject<PayoutPriorityProps> {
  static of(value: number): PayoutPriority {
    if (!Number.isInteger(value)) throw new Error('priority must be integer');
    return new PayoutPriority({ value });
  }
  get value(): number {
    return this.props.value;
  }
}
