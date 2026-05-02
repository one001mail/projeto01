import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface TxIdProps extends Record<string, unknown> {
  readonly value: string;
}
const RE = /^mocktx_[a-f0-9]{8,64}$/;

export class TxId extends ValueObject<TxIdProps> {
  static of(value: string): TxId {
    if (!RE.test(value)) throw new Error('sandbox-only mocktx_ prefix required');
    return new TxId({ value });
  }
  get value(): string {
    return this.props.value;
  }
}
