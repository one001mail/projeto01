/**
 * API-key admin auth helper.
 *
 * Constant-time comparator used by the `admin-auth` middleware. Lives in
 * `infra/auth/` so the cryptographic primitive (`timingSafeEqual`) is
 * isolated from the framework adapter.
 *
 * Sandbox-only contract:
 *   * No persistence, no key rotation, no scopes.
 *   * The expected key is read by the middleware from `Config.ADMIN_API_KEY`
 *     — a single, opaque string. If unset, admin endpoints are rejected
 *     with 503 ("silent open mode" is forbidden).
 */
import { timingSafeEqual } from 'node:crypto';

/**
 * Constant-time string comparison. Returns `false` for any falsy or
 * length-mismatched input without leaking timing differences. Both
 * arguments are treated as UTF-8 strings.
 */
export function compareApiKey(provided: unknown, expected: string): boolean {
  if (typeof provided !== 'string' || provided.length === 0) return false;
  if (typeof expected !== 'string' || expected.length === 0) return false;

  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  // timingSafeEqual requires equal lengths; length mismatch is a fast — but
  // still constant-time per length — reject.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
