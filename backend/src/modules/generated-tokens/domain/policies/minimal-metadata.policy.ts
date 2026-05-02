/**
 * MinimalMetadataPolicy.
 *
 * Domain rule: token metadata is **bounded** in cardinality and **never**
 * holds secrets. Caller-supplied metadata is filtered against an allow-list
 * of safe keys; everything else is dropped. Values are coerced to short
 * strings.
 *
 * Pure: no I/O, no framework imports.
 */
const MAX_KEYS = 8;
const MAX_KEY_LEN = 32;
const MAX_VALUE_LEN = 128;
const KEY_RE = /^[a-z][a-z0-9._-]*$/;

const FORBIDDEN_KEY_LOWER = new Set<string>([
  'authorization',
  'cookie',
  'password',
  'token',
  'secret',
  'private_key',
  'privatekey',
  'seed',
  'seed_phrase',
  'mnemonic',
  'apikey',
  'api_key',
]);

export const MinimalMetadataPolicy = {
  /**
   * Returns a sanitised, allow-listed copy of the input. Keys that match
   * any forbidden synonym are silently dropped — we never echo them.
   */
  sanitise(metadata: Record<string, unknown> | null | undefined): Record<string, string> {
    if (!metadata || typeof metadata !== 'object') return {};
    const out: Record<string, string> = {};
    let kept = 0;
    for (const [rawKey, rawVal] of Object.entries(metadata)) {
      if (kept >= MAX_KEYS) break;
      const key = String(rawKey).trim();
      if (key.length === 0 || key.length > MAX_KEY_LEN) continue;
      if (!KEY_RE.test(key)) continue;
      if (FORBIDDEN_KEY_LOWER.has(key.toLowerCase())) continue;
      const value = typeof rawVal === 'string' ? rawVal : JSON.stringify(rawVal ?? '');
      const trimmed = value.length > MAX_VALUE_LEN ? value.slice(0, MAX_VALUE_LEN) : value;
      out[key] = trimmed;
      kept += 1;
    }
    return out;
  },

  isForbiddenKey(key: string): boolean {
    return FORBIDDEN_KEY_LOWER.has(key.toLowerCase());
  },
} as const;
