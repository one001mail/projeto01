/**
 * Address value object.
 *
 * Stores a public blockchain receiving address. Validation is syntactic
 * only; full checksum validation is delegated to network-specific
 * providers. An Address is intentionally a public datum: private keys
 * NEVER appear alongside or inside this type.
 */
import { ValueObject } from '../../../../shared/domain/value-object.js';
import type { NetworkFamily } from './network.js';

export interface AddressProps extends Record<string, unknown> {
  readonly value: string;
  readonly family: NetworkFamily;
}

const ETH_RE = /^0x[0-9a-fA-F]{40}$/;
// Base58-ish check (legacy/SegWit mix); precise validation happens in providers.
const BTC_RE = /^(?:[13mn2][a-km-zA-HJ-NP-Z1-9]{25,62}|(?:tb1|bc1)[02-9ac-hj-np-z]{11,87})$/;

export class Address extends ValueObject<AddressProps> {
  static of(value: string, family: NetworkFamily): Address {
    const trimmed = value.trim();
    if (trimmed.length === 0) throw new Error('Address must not be empty');
    if (family === 'ethereum' && !ETH_RE.test(trimmed)) {
      throw new Error(`Invalid Ethereum address format: '${trimmed}'`);
    }
    if (family === 'bitcoin' && !BTC_RE.test(trimmed)) {
      throw new Error(`Invalid Bitcoin address format: '${trimmed}'`);
    }
    return new Address({ value: trimmed, family });
  }
  get value(): string {
    return this.props.value;
  }
  get family(): NetworkFamily {
    return this.props.family;
  }
}
