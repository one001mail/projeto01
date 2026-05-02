import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface ReservationIdProps extends Record<string, unknown> {
  readonly value: string;
}
export class ReservationId extends ValueObject<ReservationIdProps> {
  static of(value: string): ReservationId {
    if (!value) throw new Error('ReservationId required');
    return new ReservationId({ value });
  }
  get value(): string {
    return this.props.value;
  }
}
