import type { Clock } from '../../../../shared/application/ports/clock.port.js';
/**
 * Get Token Metadata use case.
 *
 * Loads the aggregate, refreshes derived status (the read may fall on a
 * token whose TTL elapsed) and returns the redacted-by-construction DTO.
 */
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import type { GeneratedTokenRepository } from '../../domain/repositories/generated-token.repository.js';
import type { GeneratedTokenDto } from '../dto/generated-token.dto.js';
import { GeneratedTokenMapper } from '../mappers/generated-token.mapper.js';

export type GetTokenMetadataError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'NOT_FOUND'; message: string };

export interface GetTokenMetadataInput {
  readonly id: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class GetTokenMetadataUseCase {
  constructor(
    private readonly repo: GeneratedTokenRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: GetTokenMetadataInput,
  ): Promise<Ok<GeneratedTokenDto> | Err<GetTokenMetadataError>> {
    if (!UUID_RE.test(input.id)) {
      return err({ kind: 'INVALID_INPUT', message: 'id must be a uuid' });
    }
    const found = await this.repo.findById(input.id);
    if (!found) {
      return err({ kind: 'NOT_FOUND', message: `token '${input.id}' not found` });
    }
    found.refreshStatus(this.clock.now());
    return ok(GeneratedTokenMapper.toDto(found));
  }
}
