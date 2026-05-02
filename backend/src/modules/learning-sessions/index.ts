/**
 * Learning-sessions module composition root.
 *
 * Wires the PG repository, the transaction manager + outbox from AppContext,
 * and a crypto-backed random source into the use cases, then mounts the
 * module's HTTP surface under the `/api` prefix.
 */
import { randomInt } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { idempotencyMiddleware } from '../../api/http/middlewares/idempotency.middleware.js';
import { SystemClock } from '../../shared/application/ports/clock.port.js';
import { CryptoUuidGenerator } from '../../shared/application/ports/uuid.port.js';
import { CreateLearningSessionUseCase } from './application/create-learning-session.use-case.js';
import { GetLearningSessionUseCase } from './application/get-learning-session.use-case.js';
import { makeLearningSessionsRoutes } from './infra/http/routes.js';
import { createPgLearningSessionRepository } from './infra/pg-learning-session.repository.js';

export async function registerLearningSessionsModule(app: FastifyInstance): Promise<void> {
  const tm = app.ctx.tm;
  const outbox = app.ctx.outbox;

  const repo = createPgLearningSessionRepository({
    defaultRunner: () => tm.getCurrentRunner(),
  });

  const createUc = new CreateLearningSessionUseCase({
    repo,
    tm,
    outbox,
    clock: new SystemClock(),
    uuid: new CryptoUuidGenerator(),
    random: (max) => randomInt(0, max),
  });
  const getUc = new GetLearningSessionUseCase(repo);

  await app.register(
    async (api) => {
      // Idempotency middleware applies to mutating routes in this module.
      await api.register(idempotencyMiddleware, {
        ttlSeconds: app.ctx.config.IDEMPOTENCY_TTL_SECONDS,
      });
      await api.register(makeLearningSessionsRoutes({ createUc, getUc }));
    },
    { prefix: '/api' },
  );

  app.log.debug({ module: 'learning-sessions' }, 'learning-sessions module ready');
}
