/**
 * AuditRedactionPolicy.
 *
 * Returns a copy of an audit payload where any *known-sensitive* keys are
 * masked, regardless of where they appear in the tree. The HTTP middleware
 * already redacts before persistence using `Config.AUDIT_REDACT_FIELDS`;
 * this policy is a defensive second pass for read paths so a misconfigured
 * deployment cannot leak headers / cookies through `GET /audit-logs/:id`.
 *
 * Pure: no I/O, no framework imports.
 */
const REDACTED = '<redacted>';

const SENSITIVE_KEYS_LOWER = new Set<string>([
  'authorization',
  'cookie',
  'set-cookie',
  'x-admin-api-key',
  'x-api-key',
  'password',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'private_key',
  'seed',
  'seed_phrase',
  'mnemonic',
  'email',
  'message',
]);

function redactValue(v: unknown): unknown {
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map((item) => redactValue(item));
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (SENSITIVE_KEYS_LOWER.has(k.toLowerCase())) {
      out[k] = REDACTED;
      continue;
    }
    out[k] = redactValue(val);
  }
  return out;
}

export const AuditRedactionPolicy = {
  /** Returns a deep clone with sensitive keys masked anywhere in the tree. */
  apply(payload: Record<string, unknown>): Record<string, unknown> {
    return redactValue(payload) as Record<string, unknown>;
  },
  REDACTED_PLACEHOLDER: REDACTED,
  isSensitiveKey(key: string): boolean {
    return SENSITIVE_KEYS_LOWER.has(key.toLowerCase());
  },
} as const;
