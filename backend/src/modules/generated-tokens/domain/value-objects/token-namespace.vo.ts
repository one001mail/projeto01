/**
 * TokenNamespace value object.
 *
 * Logical bucket that scopes a sandbox token (e.g. `'mix-session.demo'`,
 * `'simulator.fake-allocation'`). Pure value object — no I/O.
 */
const MAX_LEN = 64;
const RE = /^[a-z][a-z0-9._-]{0,63}$/;

export class TokenNamespace {
  private constructor(private readonly raw: string) {}

  static fromString(value: string): TokenNamespace {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.length === 0) throw new Error('TokenNamespace must not be empty');
    if (trimmed.length > MAX_LEN) throw new Error(`TokenNamespace must be <= ${MAX_LEN} chars`);
    if (!RE.test(trimmed)) {
      throw new Error('TokenNamespace must start with a letter and contain only [a-z0-9._-]');
    }
    return new TokenNamespace(trimmed);
  }

  toString(): string {
    return this.raw;
  }

  equals(other: TokenNamespace): boolean {
    return this.raw === other.raw;
  }
}
