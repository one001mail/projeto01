/**
 * Address value object — SANDBOX-ONLY, NON-WALLET, NON-SPENDABLE.
 *
 * This is NOT a blockchain address. It does NOT validate real Bitcoin,
 * Ethereum, or any other chain addresses. It does NOT derive keys. It does
 * NOT represent custody. It is a mock opaque identifier used only to label
 * destinations in the educational mixing preview.
 *
 * Validation is limited to structural sanity (length + charset of a mock
 * token format prefixed with `sbx_`), strictly to illustrate how a real
 * system would guard its input.
 */
import { ValueObject } from './value-object.js';

export interface AddressProps extends Record<string, unknown> {
  readonly value: string;
}

const MOCK_ADDRESS_RE = /^sbx_[A-Za-z0-9_-]{6,64}$/;

export class Address extends ValueObject<AddressProps> {
  static of(value: string): Address {
    if (typeof value !== 'string') throw new Error('Address must be a string');
    const trimmed = value.trim();
    if (!MOCK_ADDRESS_RE.test(trimmed)) {
      throw new Error(
        'Address is not a valid sandbox token (expected prefix "sbx_" and 6..64 url-safe chars).',
      );
    }
    return new Address({ value: trimmed });
  }

  /** Sandbox-only hint: never a real blockchain address. */
  static readonly isReal = false;

  get value(): string {
    return this.props.value;
  }
}
