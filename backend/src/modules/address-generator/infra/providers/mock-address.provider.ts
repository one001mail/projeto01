/**
 * Mock address provider — SANDBOX-ONLY.
 *
 * Produces opaque `sbx_*` tokens that are NOT blockchain addresses.
 * No private key is derived. No seed phrase is involved. No wallet is
 * created. The token is purely a local identifier.
 */
import { randomBytes } from 'node:crypto';

export interface MockAddressProvider {
  generate(): string;
}

export class RandomMockAddressProvider implements MockAddressProvider {
  generate(): string {
    const raw = randomBytes(12).toString('base64');
    const safe = raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `sbx_${safe}`;
  }
}
