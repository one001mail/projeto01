/** Domain event emitted when a sandbox token is revoked by the caller. */
export const TOKEN_REVOKED_EVENT = 'generated-tokens.token-revoked' as const;
export type TokenRevokedEventName = typeof TOKEN_REVOKED_EVENT;

export interface TokenRevokedPayload {
  readonly id: string;
  readonly namespace: string;
  readonly revokedAt: string;
}
