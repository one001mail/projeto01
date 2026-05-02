/**
 * Learning-sessions routes.
 *
 * Thin Fastify wrapper: parses inputs with Zod, delegates to the controller,
 * shapes the response with the presenter. No business rules live here.
 */
import type { FastifyPluginAsync } from 'fastify';
import type { CreateLearningSessionUseCase } from '../../application/create-learning-session.use-case.js';
import type { GetLearningSessionUseCase } from '../../application/get-learning-session.use-case.js';
import { LearningSessionsController } from './controller.js';
import { presentLearningSessionEnvelope } from './presenter.js';
import { CreateLearningSessionBodySchema, LearningSessionParamsSchema } from './schemas.js';

export interface LearningSessionsRoutesDeps {
  createUc: CreateLearningSessionUseCase;
  getUc: GetLearningSessionUseCase;
}

export function makeLearningSessionsRoutes(deps: LearningSessionsRoutesDeps): FastifyPluginAsync {
  const controller = new LearningSessionsController(deps);

  return async (app) => {
    app.post('/learning-sessions', async (req, reply) => {
      const body = CreateLearningSessionBodySchema.parse(req.body ?? {});
      const session = await controller.create(body);
      return reply.code(201).send(presentLearningSessionEnvelope(session));
    });

    app.get('/learning-sessions/:publicCode', async (req, reply) => {
      const params = LearningSessionParamsSchema.parse(req.params);
      const session = await controller.getByPublicCode(params.publicCode);
      return reply.code(200).send(presentLearningSessionEnvelope(session));
    });
  };
}
