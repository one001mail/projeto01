import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface SagaIdProps extends Record<string, unknown> {
  readonly value: string;
}
export class SagaId extends ValueObject<SagaIdProps> {
  static of(value: string): SagaId {
    if (!value) throw new Error('SagaId required');
    return new SagaId({ value });
  }
  get value(): string {
    return this.props.value;
  }
}
