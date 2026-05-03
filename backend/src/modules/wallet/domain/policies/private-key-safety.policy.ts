/**
 * Private-key safety policy (pure).
 *
 * Any value passed through the domain/application boundary is inspected
 * for fields whose names suggest private key or seed material. If found,
 * the call fails loudly. This is a belt-and-braces guard on top of the
 * architectural rule that keys never reach these layers.
 */
import { UnsafePrivateKeyOperationError } from '../errors/unsafe-private-key-operation.error.js';

const FORBIDDEN_KEYS = [
  'privateKey',
  'private_key',
  'privkey',
  'priv',
  'seed',
  'seedPhrase',
  'seed_phrase',
  'mnemonic',
  'xpriv',
  'xprv',
  'signingKey',
];

export function enforcePrivateKeySafety(
  value: unknown,
  operation = 'domain/application boundary',
): void {
  if (value === null || typeof value !== 'object') return;
  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.includes(key)) {
      throw new UnsafePrivateKeyOperationError(operation);
    }
  }
}

export function listForbiddenKeys(): readonly string[] {
  return FORBIDDEN_KEYS;
}
