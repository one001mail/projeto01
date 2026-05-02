import type { Clock } from '../../../../shared/application/ports/clock.port.js';
import type { UuidGenerator } from '../../../../shared/application/ports/uuid.port.js';
/**
 * Revoke Token use case.
 *
 * Marks an active token as revoked. Idempotent only with respect to the
 * lifecycle: revoking an already-revoked token returns INVALID_STATE so
 * callers learn they raced.
 */
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import { TOKEN_REVOKED_EVENT } from '../../domain/events/token-revoked.event.js';
import type { GeneratedTokenRepository } from '../../domain/repositories/generated-token.repository.js';
import type { GeneratedTokenDto } from '../dto/generated-token.dto.js';
import { GeneratedTokenMapper } from '../mappers/generated-token.mapper.js';
import type { OutboxEventSaver } from './generate-token.use-case.js';

export type RevokeTokenError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'NOT_FOUND'; message: string }
  | { kind: 'INVALID_STATE'; message: string };

export interface RevokeTokenDeps {
  readonly repo: GeneratedTokenRepository;
  readonly clock: Clock;
  readonly uuid: UuidGenerator;
  readonly outbox?: OutboxEventSaver;
}

export interface RevokeTokenInput {
  readonly id: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class RevokeTokenUseCase {
  constructor(private readonly deps: RevokeTokenDeps) {}

  async execute(input: RevokeTokenInput): Promise<Ok<GeneratedTokenDto> | Err<RevokeTokenError>> {
    if (!UUID_RE.test(input.id)) {
      return err({ kind: 'INVALID_INPUT', message: 'id must be a uuid' });
    }
    const found = await this.deps.repo.findById(input.id);
    if (!found) {
      return err({ kind: 'NOT_FOUND', message: `token '${input.id}' not found` });
    }
    found.refreshStatus(this.deps.clock.now());
    if (!found.status.canRevoke()) {
      return err({
        kind: 'INVALID_STATE',
        message: `token cannot be revoked from status '${found.status.toString()}'`,
      });
    }
    found.revoke();
    await this.deps.repo.update(found);

    if (this.deps.outbox) {
      const now = this.deps.clock.now();
      try {
        await this.deps.outbox.save({
          id: this.deps.uuid.v4(),
          name: TOKEN_REVOKED_EVENT,
          occurredAt: now.toISOString(),
          payload: {
            id: found.id,
            namespace: found.namespace.toString(),
            revokedAt: now.toISOString(),
          },
          aggregateId: found.id,
        });
      } catch {
        // best-effort
      }
    }
    return ok(GeneratedTokenMapper.toDto(found));
  }
}
