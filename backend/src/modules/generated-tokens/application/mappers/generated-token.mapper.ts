/** GeneratedToken -> DTO mapping. Pure. */
import type { GeneratedToken } from '../../domain/entities/generated-token.entity.js';
import { GENERATED_TOKEN_DISCLAIMER, type GeneratedTokenDto } from '../dto/generated-token.dto.js';

export const GeneratedTokenMapper = {
  toDto(token: GeneratedToken): GeneratedTokenDto {
    return {
      id: token.id,
      namespace: token.namespace.toString(),
      token: token.token.toString(),
      status: token.status.toString(),
      metadata: token.metadata,
      createdAt: token.createdAt.toISOString(),
      expiresAt: token.expiresAt ? token.expiresAt.toISOString() : null,
      disclaimer: GENERATED_TOKEN_DISCLAIMER,
    };
  },
} as const;
