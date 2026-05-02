/**
 * PublicCode value object.
 *
 * Short opaque URL-safe identifier surfaced to the user (session_code in
 * the DB). Pure — generation takes a per-call random source so tests and
 * production can agree on the alphabet without coupling to `crypto`.
 */
export const PUBLIC_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 31 chars, no 0/O/1/I/L
export const PUBLIC_CODE_LENGTH = 10;

export type RandomSource = (max: number) => number;

export function generatePublicCode(rand: RandomSource): string {
  const a = PUBLIC_CODE_ALPHABET;
  let out = '';
  for (let i = 0; i < PUBLIC_CODE_LENGTH; i += 1) {
    const idx = rand(a.length);
    if (idx < 0 || idx >= a.length) {
      throw new Error(`RandomSource returned out-of-range index ${idx}`);
    }
    out += a[idx];
  }
  return out;
}

export function isValidPublicCode(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (value.length !== PUBLIC_CODE_LENGTH) return false;
  for (let i = 0; i < value.length; i += 1) {
    if (!PUBLIC_CODE_ALPHABET.includes(value[i] as string)) return false;
  }
  return true;
}
