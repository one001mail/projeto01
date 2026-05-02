/**
 * TokenExpirationPolicy.
 *
 * Decides whether a token has elapsed its TTL relative to a clock instant.
 * Pure — no I/O.
 */
export const TokenExpirationPolicy = {
  isExpired(expiresAt: Date | null, now: Date): boolean {
    if (!expiresAt) return false;
    return now.getTime() >= expiresAt.getTime();
  },
} as const;
