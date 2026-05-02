import type { Clock } from '../../../../shared/application/ports/clock.port.js';
import type { UuidGenerator } from '../../../../shared/application/ports/uuid.port.js';
/**
 * Expire Token use case.
 *
 * Forces the lifecycle transition for tokens whose TTL elapsed but no
 * background sweep has run yet. Safe to invoke at read time.
 */
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import { TOKEN_EXPIRED_EVENT } from '../../domain/events/token-expired.event.js';
import { TokenExpirationPolicy } from '../../domain/policies/token-expiration.policy.js';
import type { GeneratedTokenRepository } from '../../domain/repositories/generated-token.repository.js';
import type { GeneratedTokenDto } from '../dto/generated-token.dto.js';
import { GeneratedTokenMapper } from '../mappers/generated-token.mapper.js';
import type { OutboxEventSaver } from './generate-token.use-case.js';

export type ExpireTokenError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'NOT_FOUND'; message: string };

export interface ExpireTokenDeps {
  readonly repo: GeneratedTokenRepository;
  readonly clock: Clock;
  readonly uuid: UuidGenerator;
  readonly outbox?: OutboxEventSaver;
}

export interface ExpireTokenInput {
  readonly id: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ExpireTokenUseCase {
  constructor(private readonly deps: ExpireTokenDeps) {}

  async execute(input: ExpireTokenInput): Promise<Ok<GeneratedTokenDto> | Err<ExpireTokenError>> {
    if (!UUID_RE.test(input.id)) {
      return err({ kind: 'INVALID_INPUT', message: 'id must be a uuid' });
    }
    const found = await this.deps.repo.findById(input.id);
    if (!found) {
      return err({ kind: 'NOT_FOUND', message: `token '${input.id}' not found` });
    }
    const now = this.deps.clock.now();
    if (found.status.isActive() && TokenExpirationPolicy.isExpired(found.expiresAt, now)) {
      found.expire();
      await this.deps.repo.update(found);

      if (this.deps.outbox) {
        try {
          await this.deps.outbox.save({
            id: this.deps.uuid.v4(),
            name: TOKEN_EXPIRED_EVENT,
            occurredAt: now.toISOString(),
            payload: {
              id: found.id,
              namespace: found.namespace.toString(),
              expiredAt: now.toISOString(),
            },
            aggregateId: found.id,
          });
        } catch {
          // best-effort
        }
      }
    }
    return ok(GeneratedTokenMapper.toDto(found));
  }
}
