/**
 * Random sandbox token provider.
 *
 * Produces opaque values of the form `sbx_<random>` using `crypto.randomBytes`
 * and base32 encoding (Crockford-friendly alphabet, lowercase). Length is
 * fixed so the token cannot be confused with any blockchain payload.
 *
 * Pure-ish: depends on `node:crypto` only. Lives in `infra/providers` so
 * it can use Node built-ins without polluting the domain layer.
 */
import { randomBytes } from 'node:crypto';
import type { SandboxTokenGenerator } from '../../domain/services/sandbox-token-generator.service.js';
import { SandboxToken } from '../../domain/value-objects/sandbox-token.vo.js';

const ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz'; // 32 chars, no i/l/o/u
const RAW_BYTES = 14; // ~22 base32 chars

function toBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += ALPHABET[(value >>> bits) & 0x1f];
    }
  }
  if (bits > 0) {
    out += ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return out;
}

export function createRandomSandboxTokenGenerator(): SandboxTokenGenerator {
  return {
    generate(): SandboxToken {
      const raw = toBase32(randomBytes(RAW_BYTES));
      return SandboxToken.fromString(`sbx_${raw}`);
    },
  };
}
