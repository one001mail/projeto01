/**
 * Redaction utility.
 *
 * Pure function that takes a JSON-shaped value and a list of dotted paths,
 * and returns a deep clone with each matching value replaced by the literal
 * string `'<redacted>'`. Used by the HTTP `audit-log` middleware before
 * persisting any request payload.
 *
 * Path grammar:
 *   * Dot-separated segments  -- `body.email`, `headers.authorization`
 *   * Single `*` wildcard segment matches any key at that depth
 *     -- `body.*.email` masks `email` under every direct child of `body`
 *   * Array indices are addressable as `body.items.0.token` or via wildcard
 *
 * Non-goals:
 *   * No regex matching -- keep grammar minimal so policies are auditable.
 *   * No schema-level masking -- redaction is path-based and fail-safe
 *     (paths that don't exist are silently ignored).
 *
 * Boundary: pure (no fastify / pg / ioredis). Lives in `shared/application/`.
 */
const REDACTED = '<redacted>';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function cloneJson<T>(v: T): T {
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map((x) => cloneJson(x)) as unknown as T;
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    out[k] = cloneJson(val);
  }
  return out as T;
}

function applyPath(target: unknown, segments: readonly string[]): void {
  if (segments.length === 0) return;
  const [head, ...rest] = segments;
  if (head === undefined) return;

  // Wildcard: branch into every child.
  if (head === '*') {
    if (Array.isArray(target)) {
      for (let i = 0; i < target.length; i++) {
        if (rest.length === 0) {
          target[i] = REDACTED;
        } else {
          applyPath(target[i], rest);
        }
      }
      return;
    }
    if (isRecord(target)) {
      for (const k of Object.keys(target)) {
        if (rest.length === 0) {
          target[k] = REDACTED;
        } else {
          applyPath(target[k], rest);
        }
      }
    }
    return;
  }

  // Concrete segment.
  if (Array.isArray(target)) {
    const idx = Number(head);
    if (!Number.isInteger(idx) || idx < 0 || idx >= target.length) return;
    if (rest.length === 0) {
      target[idx] = REDACTED;
    } else {
      applyPath(target[idx], rest);
    }
    return;
  }

  if (!isRecord(target)) return;
  if (!(head in target)) return;

  if (rest.length === 0) {
    target[head] = REDACTED;
    return;
  }
  applyPath(target[head], rest);
}

export function redactPayload(payload: unknown, redactPaths: readonly string[]): unknown {
  // Deep-clone first so callers' inputs are never mutated.
  const cloned = cloneJson(payload);
  if (!redactPaths || redactPaths.length === 0) return cloned;
  for (const p of redactPaths) {
    if (!p) continue;
    applyPath(cloned, p.split('.'));
  }
  return cloned;
}

export const REDACTED_PLACEHOLDER = REDACTED;
