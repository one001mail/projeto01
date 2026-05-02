/**
 * Address Token value-object identity — SANDBOX-ONLY.
 *
 * NOT a wallet. NOT a seed. NOT a blockchain address.
 */
import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface AddressTokenIdProps extends Record<string, unknown> {
  readonly value: string;
}

export class AddressTokenId extends ValueObject<AddressTokenIdProps> {
  static of(value: string): AddressTokenId {
    if (!value || value.length < 6) throw new Error('AddressTokenId too short');
    return new AddressTokenId({ value });
  }
  get value(): string {
    return this.props.value;
  }
}
