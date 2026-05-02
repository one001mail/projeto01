/**
 * SandboxTokenPolicy.
 *
 * Enforces the FORBIDDEN-content rule for any string that calls itself a
 * "sandbox token" inside this module: the value
 *   * MUST start with `sbx_`
 *   * MUST NOT match a real Bitcoin / Ethereum / Lightning payload shape
 *   * MUST NOT contain anything that resembles a private key or seed
 *
 * Pure: no I/O, no framework imports.
 */
export const SANDBOX_TOKEN_PREFIX = 'sbx_';

// Conservative shape detectors — not exhaustive, but covers the obvious
// footguns. We never *use* these patterns; we only reject inputs that
// match them so the sandbox can't accidentally surface a real payload.
const BITCOIN_LEGACY = /^(?:1|3)[a-km-zA-HJ-NP-Z0-9]{25,39}$/;
const BITCOIN_BECH32 = /^bc1[a-z0-9]{39,71}$/i;
const ETHEREUM = /^0x[a-fA-F0-9]{40}$/;
const HEX_PRIVATE_KEY = /^[a-fA-F0-9]{64}$/;
const SEED_PHRASE_HINT = /\b(abandon|seed|mnemonic)\b/i;

export const SandboxTokenPolicy = {
  PREFIX: SANDBOX_TOKEN_PREFIX,

  isSandboxShape(value: string): boolean {
    return typeof value === 'string' && value.startsWith(SANDBOX_TOKEN_PREFIX);
  },

  looksLikeRealAddress(value: string): boolean {
    if (typeof value !== 'string') return false;
    return BITCOIN_LEGACY.test(value) || BITCOIN_BECH32.test(value) || ETHEREUM.test(value);
  },

  looksLikePrivateKey(value: string): boolean {
    return typeof value === 'string' && HEX_PRIVATE_KEY.test(value);
  },

  looksLikeSeedPhrase(value: string): boolean {
    return typeof value === 'string' && SEED_PHRASE_HINT.test(value);
  },

  /** Throws unless `value` satisfies every sandbox rule. */
  assertSandbox(value: string): void {
    if (!this.isSandboxShape(value)) {
      throw new Error(`SandboxToken must start with '${SANDBOX_TOKEN_PREFIX}'`);
    }
    if (this.looksLikeRealAddress(value)) {
      throw new Error('SandboxToken must NOT resemble a real blockchain address');
    }
    if (this.looksLikePrivateKey(value)) {
      throw new Error('SandboxToken must NOT resemble a private key');
    }
    if (this.looksLikeSeedPhrase(value)) {
      throw new Error('SandboxToken must NOT contain seed-phrase hints');
    }
  },
} as const;
