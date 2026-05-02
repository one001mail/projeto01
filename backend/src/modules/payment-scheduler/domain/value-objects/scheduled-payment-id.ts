import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface ScheduledPaymentIdProps extends Record<string, unknown> {
  readonly value: string;
}
export class ScheduledPaymentId extends ValueObject<ScheduledPaymentIdProps> {
  static of(value: string): ScheduledPaymentId {
    if (!value) throw new Error('ScheduledPaymentId required');
    return new ScheduledPaymentId({ value });
  }
  get value(): string {
    return this.props.value;
  }
}
