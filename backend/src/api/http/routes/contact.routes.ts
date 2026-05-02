/**
 * Contact route.
 *
 *   POST /api/contact — submit a generic contact request.
 *
 * Idempotency middleware is mounted in this scope so callers can use
 * `Idempotency-Key` to safely retry the POST. Mutating verb → audit-log
 * middleware persists a redacted entry once the response succeeds.
 */
import type { FastifyPluginAsync } from 'fastify';
import { AppError } from '../../../shared/errors/app-error.js';
import { ContactController } from '../controllers/contact.controller.js';
import { idempotencyMiddleware } from '../middlewares/idempotency.middleware.js';
import { presentCreated } from '../presenters/created.presenter.js';
import { SubmitContactBodySchema } from '../schemas/contact.schemas.js';

export const contactRoutes: FastifyPluginAsync = async (app) => {
  const registry = app.ctx.useCases.contact;
  if (!registry) {
    throw AppError.serviceUnavailable(
      'contact use cases are not registered (contact-requests module disabled?)',
    );
  }
  const controller = new ContactController(registry);

  await app.register(idempotencyMiddleware, {
    ttlSeconds: app.ctx.config.IDEMPOTENCY_TTL_SECONDS,
  });

  app.post('/contact', async (req, reply) => {
    const body = SubmitContactBodySchema.parse(req.body ?? {});
    const dto = await controller.submit(body);
    reply.header('Location', `/api/contact/${dto.id}`);
    return reply.code(201).send(presentCreated(dto, req.id));
  });
};
