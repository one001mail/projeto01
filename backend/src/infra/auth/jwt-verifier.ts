/**
 * JWT verifier — SANDBOX PLACEHOLDER.
 *
 * This module does NOT verify real JWTs, does NOT issue tokens, and does
 * NOT reach any OAuth provider. It exists purely for architectural parity
 * with the master prompt; the active admin auth path uses an API key
 * (see `infra/auth/api-key.admin-auth.ts`).
 */
export interface JwtClaims {
  readonly sub: string;
  readonly roles: readonly string[];
  readonly exp: number;
}

export interface JwtVerifier {
  /** Always returns null — no JWT accepted in sandbox. */
  verify(token: string): JwtClaims | null;
}

export class NoopJwtVerifier implements JwtVerifier {
  verify(_token: string): JwtClaims | null {
    return null;
  }
}

export const jwtVerifier: JwtVerifier = new NoopJwtVerifier();
