/**
 * Mix-session routes (sandbox-only).
 *
 *   POST /api/mix-sessions       — create a new educational session.
 *   GET  /api/mix-sessions/:id   — fetch by public id.
 *
 * Idempotency middleware is mounted in this scope so callers can use
 * `Idempotency-Key` to safely retry the POST.
 *
 * Sandbox-only: every response carries `sandboxNotice` (added by the
 * presenter). No real transactions, no chain calls, no anonymity.
 */
import type { FastifyPluginAsync } from 'fastify';
import { AppError } from '../../../shared/errors/app-error.js';
import { MixSessionController } from '../controllers/mix-session.controller.js';
import { idempotencyMiddleware } from '../middlewares/idempotency.middleware.js';
import { presentCreated } from '../presenters/created.presenter.js';
import { presentOk } from '../presenters/ok.presenter.js';
import {
  CreateMixSessionBodySchema,
  GetMixSessionParamsSchema,
} from '../schemas/mix-session.schemas.js';

export const mixSessionRoutes: FastifyPluginAsync = async (app) => {
  const registry = app.ctx.useCases.mixSession;
  if (!registry) {
    throw AppError.serviceUnavailable(
      'mix-session use cases are not registered (learning-sessions module disabled?)',
    );
  }
  const controller = new MixSessionController(registry);

  await app.register(idempotencyMiddleware, {
    ttlSeconds: app.ctx.config.IDEMPOTENCY_TTL_SECONDS,
  });

  app.post('/mix-sessions', async (req, reply) => {
    const body = CreateMixSessionBodySchema.parse(req.body ?? {});
    const dto = await controller.create(body);
    reply.header('Location', `/api/mix-sessions/${dto.publicId}`);
    return reply.code(201).send(presentCreated(dto, req.id));
  });

  app.get('/mix-sessions/:id', async (req, reply) => {
    const params = GetMixSessionParamsSchema.parse(req.params);
    const dto = await controller.getById(params.id);
    return reply.code(200).send(presentOk(dto, req.id));
  });
};
