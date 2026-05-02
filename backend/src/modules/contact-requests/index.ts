/**
 * Contact-requests module composition root.
 */
import type { FastifyInstance } from 'fastify';
import { idempotencyMiddleware } from '../../api/http/middlewares/idempotency.middleware.js';
import { SystemClock } from '../../shared/application/ports/clock.port.js';
import { CryptoUuidGenerator } from '../../shared/application/ports/uuid.port.js';
import { SubmitContactRequestUseCase } from './application/submit-contact-request.use-case.js';
import { makeContactRequestsRoutes } from './infra/http/routes.js';
import { createPgContactRequestRepository } from './infra/pg-contact-request.repository.js';

export async function registerContactRequestsModule(app: FastifyInstance): Promise<void> {
  const tm = app.ctx.tm;
  const outbox = app.ctx.outbox;

  const repo = createPgContactRequestRepository({
    defaultRunner: () => tm.getCurrentRunner(),
  });

  const submitUc = new SubmitContactRequestUseCase({
    repo,
    tm,
    outbox,
    clock: new SystemClock(),
    uuid: new CryptoUuidGenerator(),
  });

  await app.register(
    async (api) => {
      await api.register(idempotencyMiddleware, {
        ttlSeconds: app.ctx.config.IDEMPOTENCY_TTL_SECONDS,
      });
      await api.register(makeContactRequestsRoutes({ submitUc }));
    },
    { prefix: '/api' },
  );

  app.log.debug({ module: 'contact-requests' }, 'contact-requests module ready');
}
