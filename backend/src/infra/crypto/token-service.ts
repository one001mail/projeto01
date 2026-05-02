/**
 * Token service — SANDBOX-ONLY.
 *
 * Generates short, URL-safe opaque tokens used for mock address tokens
 * and generated identifiers. These are NOT wallets, NOT private keys,
 * NOT blockchain addresses, and NOT derived from any seed phrase.
 */
import { randomBytes } from 'node:crypto';

export interface TokenService {
  /** URL-safe random token of the given byte length (default 16). */
  urlSafe(byteLen?: number): string;
  /** Sandbox address-style token, always prefixed with `sbx_`. */
  mockAddress(): string;
  /** Sandbox transaction-style token, always prefixed with `mocktx_`. */
  mockTxId(): string;
}

function toUrlSafe(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export class RandomTokenService implements TokenService {
  urlSafe(byteLen = 16): string {
    return toUrlSafe(randomBytes(byteLen));
  }

  mockAddress(): string {
    return `sbx_${this.urlSafe(12)}`;
  }

  mockTxId(): string {
    return `mocktx_${randomBytes(16).toString('hex')}`;
  }
}

export const tokenService: TokenService = new RandomTokenService();
