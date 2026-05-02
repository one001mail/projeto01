/** Domain event emitted when a new sandbox token is created. */
export const TOKEN_GENERATED_EVENT = 'generated-tokens.token-generated' as const;
export type TokenGeneratedEventName = typeof TOKEN_GENERATED_EVENT;

export interface TokenGeneratedPayload {
  readonly id: string;
  readonly namespace: string;
  readonly tokenPrefix: string;
  readonly createdAt: string;
  readonly expiresAt: string | null;
}
