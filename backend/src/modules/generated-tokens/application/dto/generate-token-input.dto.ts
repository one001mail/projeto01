/**
 * Input DTO for `generate-token.use-case`. Caller-facing shape — the use
 * case decodes it into the domain value objects.
 */
export interface GenerateTokenInputDto {
  readonly namespace: string;
  readonly ttlSeconds?: number | null;
  readonly metadata?: Record<string, unknown> | null;
}
