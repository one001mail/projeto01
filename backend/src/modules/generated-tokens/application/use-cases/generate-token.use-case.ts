import type { Clock } from '../../../../shared/application/ports/clock.port.js';
import type { UuidGenerator } from '../../../../shared/application/ports/uuid.port.js';
/**
 * Generate Token use case.
 *
 * Validates input, asks the generator port for an opaque sandbox string,
 * applies the metadata policy, persists the aggregate, and emits a
 * domain event through the outbox port (best-effort).
 */
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import { GeneratedToken } from '../../domain/entities/generated-token.entity.js';
import { TOKEN_GENERATED_EVENT } from '../../domain/events/token-generated.event.js';
import type { GeneratedTokenRepository } from '../../domain/repositories/generated-token.repository.js';
import type { SandboxTokenGenerator } from '../../domain/services/sandbox-token-generator.service.js';
import { TokenNamespace } from '../../domain/value-objects/token-namespace.vo.js';
import type { GenerateTokenInputDto } from '../dto/generate-token-input.dto.js';
import type { GeneratedTokenDto } from '../dto/generated-token.dto.js';
import { GeneratedTokenMapper } from '../mappers/generated-token.mapper.js';

export type GenerateTokenError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'COLLISION'; message: string };

export interface OutboxEventSaver {
  save(event: {
    id: string;
    name: string;
    occurredAt: string;
    payload: unknown;
    aggregateId?: string;
  }): Promise<string>;
}

export interface GenerateTokenDeps {
  readonly repo: GeneratedTokenRepository;
  readonly generator: SandboxTokenGenerator;
  readonly clock: Clock;
  readonly uuid: UuidGenerator;
  readonly outbox?: OutboxEventSaver;
}

const MAX_COLLISION_RETRIES = 5;
const MAX_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MIN_TTL_SECONDS = 1;

export class GenerateTokenUseCase {
  constructor(private readonly deps: GenerateTokenDeps) {}

  async execute(
    input: GenerateTokenInputDto,
  ): Promise<Ok<GeneratedTokenDto> | Err<GenerateTokenError>> {
    let namespace: TokenNamespace;
    try {
      namespace = TokenNamespace.fromString(input.namespace);
    } catch (e) {
      return err({
        kind: 'INVALID_INPUT',
        message: e instanceof Error ? e.message : 'invalid namespace',
      });
    }

    let expiresAt: Date | null = null;
    if (typeof input.ttlSeconds === 'number') {
      if (
        !Number.isFinite(input.ttlSeconds) ||
        !Number.isInteger(input.ttlSeconds) ||
        input.ttlSeconds < MIN_TTL_SECONDS ||
        input.ttlSeconds > MAX_TTL_SECONDS
      ) {
        return err({
          kind: 'INVALID_INPUT',
          message: `ttlSeconds must be an integer between ${MIN_TTL_SECONDS} and ${MAX_TTL_SECONDS}`,
        });
      }
      expiresAt = new Date(this.deps.clock.now().getTime() + input.ttlSeconds * 1000);
    }

    let collisions = 0;
    while (collisions < MAX_COLLISION_RETRIES) {
      const token = this.deps.generator.generate();
      const existing = await this.deps.repo.findByToken(token.toString());
      if (existing) {
        collisions += 1;
        continue;
      }
      const id = this.deps.uuid.v4();
      const now = this.deps.clock.now();
      const aggregate = GeneratedToken.create({
        id,
        namespace,
        token,
        metadata: (input.metadata ?? null) as Record<string, unknown> | null,
        createdAt: now,
        expiresAt,
      });
      await this.deps.repo.save(aggregate);

      if (this.deps.outbox) {
        try {
          await this.deps.outbox.save({
            id: this.deps.uuid.v4(),
            name: TOKEN_GENERATED_EVENT,
            occurredAt: now.toISOString(),
            payload: {
              id,
              namespace: namespace.toString(),
              tokenPrefix: token.toString().slice(0, 8),
              createdAt: now.toISOString(),
              expiresAt: expiresAt ? expiresAt.toISOString() : null,
            },
            aggregateId: id,
          });
        } catch {
          // best-effort — outbox is async; swallow to keep aggregate persisted.
        }
      }
      return ok(GeneratedTokenMapper.toDto(aggregate));
    }
    return err({
      kind: 'COLLISION',
      message: `Could not generate a unique sandbox token after ${MAX_COLLISION_RETRIES} attempts`,
    });
  }
}
