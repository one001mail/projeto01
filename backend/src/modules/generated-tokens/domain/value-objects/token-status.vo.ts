/**
 * TokenStatus value object.
 *
 * Lifecycle state of a generated token: active, revoked, or expired.
 * Pure value object with controlled transitions.
 */
const VALUES = ['active', 'revoked', 'expired'] as const;
export type TokenStatusValue = (typeof VALUES)[number];

export class TokenStatus {
  private constructor(private readonly v: TokenStatusValue) {}

  static active(): TokenStatus {
    return new TokenStatus('active');
  }
  static revoked(): TokenStatus {
    return new TokenStatus('revoked');
  }
  static expired(): TokenStatus {
    return new TokenStatus('expired');
  }
  static fromString(v: string): TokenStatus {
    if (!(VALUES as readonly string[]).includes(v)) {
      throw new Error(`Invalid TokenStatus '${v}'`);
    }
    return new TokenStatus(v as TokenStatusValue);
  }

  toString(): TokenStatusValue {
    return this.v;
  }

  isActive(): boolean {
    return this.v === 'active';
  }
  isRevoked(): boolean {
    return this.v === 'revoked';
  }
  isExpired(): boolean {
    return this.v === 'expired';
  }
  /** Active is the only state that may transition to revoked or expired. */
  canRevoke(): boolean {
    return this.v === 'active';
  }
  canExpire(): boolean {
    return this.v === 'active';
  }
}
