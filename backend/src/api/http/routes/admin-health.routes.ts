/**
 * Admin health route.
 */
import type { FastifyPluginAsync } from 'fastify';
import { adminHealthController } from '../controllers/admin-health.controller.js';
import { presentAdminHealth } from '../presenters/admin-health.presenter.js';

export const adminHealthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/admin/health', async (_req, reply) => {
    const result = await adminHealthController(app);
    const body = presentAdminHealth(result);
    return reply.code(result.status === 'ok' ? 200 : 503).send(body);
  });
};
