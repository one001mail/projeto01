/**
 * ReservationExpirationPolicy.
 *
 * Pure rule: a reservation expires when wall-clock now is at or past the
 * configured `expiresAt`. Mirrors `TokenExpirationPolicy`.
 */
export const ReservationExpirationPolicy = {
  isExpired(expiresAt: Date | null, now: Date): boolean {
    if (!expiresAt) return false;
    return now.getTime() >= expiresAt.getTime();
  },
} as const;
