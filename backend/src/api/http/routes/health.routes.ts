/**
 * Health route.
 *
 * Thin HTTP wrapper: schema in `schemas/`, business in `controllers/`,
 * response shaping in `presenters/`.
 */
import type { FastifyPluginAsync } from 'fastify';
import { healthController } from '../controllers/health.controller.js';
import { presentHealth } from '../presenters/health.presenter.js';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async (_req, reply) => {
    const result = await healthController(app);
    const body = presentHealth(result);
    return reply.code(200).send(body);
  });
};
