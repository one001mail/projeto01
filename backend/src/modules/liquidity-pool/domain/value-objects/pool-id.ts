import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface PoolIdProps extends Record<string, unknown> {
  readonly value: string;
}
export class PoolId extends ValueObject<PoolIdProps> {
  static of(value: string): PoolId {
    if (!value) throw new Error('PoolId required');
    return new PoolId({ value });
  }
  get value(): string {
    return this.props.value;
  }
}
