/**
 * generated-tokens module composition root.
 *
 * Sandbox-only module that mints opaque `sbx_*` identifiers. NEVER produces
 * Bitcoin/Ethereum addresses, NEVER signs anything, NEVER touches a wallet.
 */
import type { FastifyInstance } from 'fastify';
import { SystemClock } from '../../shared/application/ports/clock.port.js';
import { CryptoUuidGenerator } from '../../shared/application/ports/uuid.port.js';
import { ExpireTokenUseCase } from './application/use-cases/expire-token.use-case.js';
import { GenerateTokenUseCase } from './application/use-cases/generate-token.use-case.js';
import { GetTokenMetadataUseCase } from './application/use-cases/get-token-metadata.use-case.js';
import { RevokeTokenUseCase } from './application/use-cases/revoke-token.use-case.js';
import type { GeneratedTokenRepository } from './domain/repositories/generated-token.repository.js';
import { InMemoryGeneratedTokenRepository } from './infra/persistence/in-memory-generated-token.repository.js';
import { createPgGeneratedTokenRepository } from './infra/persistence/pg-generated-token.repository.js';
import { createRandomSandboxTokenGenerator } from './infra/providers/random-sandbox-token.provider.js';

export async function registerGeneratedTokensModule(app: FastifyInstance): Promise<void> {
  const ctx = app.ctx;
  const clock = new SystemClock();
  const uuid = new CryptoUuidGenerator();
  const generator = createRandomSandboxTokenGenerator();

  const repo: GeneratedTokenRepository = ctx.sandboxFallback
    ? new InMemoryGeneratedTokenRepository()
    : createPgGeneratedTokenRepository(ctx.tm);

  const outboxSaver = {
    save: async (e: {
      id: string;
      name: string;
      occurredAt: string;
      payload: unknown;
      aggregateId?: string;
    }) => ctx.outbox.save(e),
  };

  const generateUc = new GenerateTokenUseCase({
    repo,
    generator,
    clock,
    uuid,
    outbox: outboxSaver,
  });
  const revokeUc = new RevokeTokenUseCase({ repo, clock, uuid, outbox: outboxSaver });
  const expireUc = new ExpireTokenUseCase({ repo, clock, uuid, outbox: outboxSaver });
  const getMetadataUc = new GetTokenMetadataUseCase(repo, clock);

  ctx.useCases.generatedTokens = {
    generate: generateUc,
    revoke: revokeUc,
    expire: expireUc,
    getMetadata: getMetadataUc,
  };

  app.log.debug({ module: 'generated-tokens' }, 'generated-tokens module ready');
}
