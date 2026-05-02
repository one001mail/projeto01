/**
 * Admin routes.
 *
 *   GET /api/admin/health      — operator-grade dependency probe.
 *   GET /api/admin/audit-logs  — paginated read of the audit trail.
 *
 * Mount this plugin under a Fastify scope guarded by `adminAuthMiddleware`
 * so every route below is admin-gated.
 */
import type { FastifyPluginAsync } from 'fastify';
import { adminHealthController } from '../controllers/admin-health.controller.js';
import { adminAuditLogsController } from '../controllers/admin.controller.js';
import { presentAdminHealth } from '../presenters/admin-health.presenter.js';
import { presentPaginated } from '../presenters/paginated.presenter.js';
import { PaginationQuerySchema } from '../schemas/common.schemas.js';

export const adminRoutes: FastifyPluginAsync = async (app) => {
  // GET /admin/health
  app.get('/health', async (req, reply) => {
    const result = await adminHealthController(app);
    const body = presentAdminHealth(result);
    void req;
    return reply.code(result.status === 'ok' ? 200 : 503).send(body);
  });

  // GET /admin/audit-logs?limit=&offset=
  app.get('/audit-logs', async (req, reply) => {
    const query = PaginationQuerySchema.parse(req.query ?? {});
    const result = await adminAuditLogsController(app, {
      ...(query.limit !== undefined ? { limit: query.limit } : {}),
      ...(query.offset !== undefined ? { offset: query.offset } : {}),
    });
    const env = presentPaginated(
      {
        items: result.entries,
        limit: result.limit,
        offset: result.offset,
        total: result.total,
      },
      req.id,
    );
    return reply.code(200).send({
      ...env,
      retrievedAt: result.retrievedAt,
    });
  });
};
