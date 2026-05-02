/** Domain event emitted when a sandbox token elapses its TTL. */
export const TOKEN_EXPIRED_EVENT = 'generated-tokens.token-expired' as const;
export type TokenExpiredEventName = typeof TOKEN_EXPIRED_EVENT;

export interface TokenExpiredPayload {
  readonly id: string;
  readonly namespace: string;
  readonly expiredAt: string;
}
