/**
 * Contact-requests routes.
 */
import type { FastifyPluginAsync } from 'fastify';
import type { SubmitContactRequestUseCase } from '../../application/submit-contact-request.use-case.js';
import { ContactRequestsController } from './controller.js';
import { presentContactRequestEnvelope } from './presenter.js';
import { SubmitContactRequestBodySchema } from './schemas.js';

export interface ContactRequestsRoutesDeps {
  submitUc: SubmitContactRequestUseCase;
}

export function makeContactRequestsRoutes(deps: ContactRequestsRoutesDeps): FastifyPluginAsync {
  const controller = new ContactRequestsController(deps);

  return async (app) => {
    app.post('/contact-requests', async (req, reply) => {
      const body = SubmitContactRequestBodySchema.parse(req.body ?? {});
      const request = await controller.submit(body);
      return reply.code(201).send(presentContactRequestEnvelope(request));
    });
  };
}
