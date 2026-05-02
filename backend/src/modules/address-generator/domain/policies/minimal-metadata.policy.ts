/**
 * Minimal-metadata policy.
 *
 * Prevents storing any identifying metadata beyond a bounded allowlist.
 */
const ALLOWED_KEYS = new Set(['namespace', 'correlationId', 'purpose']);

export function enforceMinimalMetadata(input: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) {
    if (!ALLOWED_KEYS.has(k)) continue;
    if (v === null || v === undefined) continue;
    out[k] = String(v).slice(0, 120);
  }
  return out;
}
