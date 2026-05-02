/**
 * AuditAction value object.
 *
 * Stable per-scope grammar for what was audited, e.g.
 * `'POST /api/contact-requests'`, `'admin.audit.read'`. Pure value object.
 */
const MAX_LEN = 200;

export class AuditAction {
  private constructor(private readonly raw: string) {}

  static fromString(value: string): AuditAction {
    const trimmed = value.trim();
    if (trimmed.length === 0) throw new Error('AuditAction must not be empty');
    if (trimmed.length > MAX_LEN) throw new Error(`AuditAction must be <= ${MAX_LEN} chars`);
    return new AuditAction(trimmed);
  }

  toString(): string {
    return this.raw;
  }

  equals(other: AuditAction): boolean {
    return this.raw === other.raw;
  }
}
