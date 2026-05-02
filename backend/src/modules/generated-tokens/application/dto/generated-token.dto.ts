/** Public DTO for generated-tokens use cases. */
export interface GeneratedTokenDto {
  readonly id: string;
  readonly namespace: string;
  readonly token: string;
  readonly status: 'active' | 'revoked' | 'expired';
  readonly metadata: Record<string, string>;
  readonly createdAt: string;
  readonly expiresAt: string | null;
  readonly disclaimer: string;
}

export const GENERATED_TOKEN_DISCLAIMER =
  'Sandbox-only opaque identifier. NOT a Bitcoin or Ethereum address, NOT a wallet, NOT custodial.';
