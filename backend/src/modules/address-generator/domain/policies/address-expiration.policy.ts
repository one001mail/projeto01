/**
 * Expiration policy.
 */
export function isExpired(expiresAt: Date | null, now: Date): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() <= now.getTime();
}

export const DEFAULT_EXPIRATION_SECONDS = 60 * 60 * 24;
