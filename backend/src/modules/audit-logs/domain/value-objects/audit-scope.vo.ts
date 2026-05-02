/**
 * AuditScope value object.
 *
 * Logical bucket of an audit entry (e.g. `'http'`, `'admin'`, `'modules.audit-logs'`).
 * Pure: no I/O, no framework imports. Validates shape only — non-empty,
 * lowercase-friendly, length-bounded.
 */
const MAX_LEN = 64;
const SCOPE_RE = /^[a-zA-Z0-9._-]+$/;

export class AuditScope {
  private constructor(private readonly raw: string) {}

  static fromString(value: string): AuditScope {
    const trimmed = value.trim();
    if (trimmed.length === 0) throw new Error('AuditScope must not be empty');
    if (trimmed.length > MAX_LEN) throw new Error(`AuditScope must be <= ${MAX_LEN} chars`);
    if (!SCOPE_RE.test(trimmed)) {
      throw new Error('AuditScope contains invalid characters (use [a-zA-Z0-9._-])');
    }
    return new AuditScope(trimmed);
  }

  toString(): string {
    return this.raw;
  }

  equals(other: AuditScope): boolean {
    return this.raw === other.raw;
  }
}
