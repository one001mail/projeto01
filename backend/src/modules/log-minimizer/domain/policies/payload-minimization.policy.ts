const ALLOWED = new Set(['event', 'scope', 'requestId', 'status']);

export function minimizePayload(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (ALLOWED.has(k)) out[k] = v;
  }
  return out;
}
