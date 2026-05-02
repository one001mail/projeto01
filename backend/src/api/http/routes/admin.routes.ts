/**
 * Admin routes.
 *
 *   GET /api/admin/health                          — operator dependency probe.
 *   GET /api/admin/audit-logs                      — paginated audit trail.
 *   GET /api/admin/audit-logs/:id                  — redacted audit detail.
 *   GET /api/admin/generated-tokens/:id            — sandbox token detail.
 *   GET /api/admin/resource-reservations/:id       — sandbox reservation detail.
 *
 * Mount this plugin under a Fastify scope guarded by `adminAuthMiddleware`
 * so every route below is admin-gated.
 */
import type { FastifyPluginAsync } from 'fastify';
import { adminHealthController } from '../controllers/admin-health.controller.js';
import {
  type AdminSubject,
  adminAuditLogDetailController,
  adminAuditLogsController,
  adminGeneratedTokenDetailController,
  adminResourceReservationDetailController,
} from '../controllers/admin.controller.js';
import { presentAdminHealth } from '../presenters/admin-health.presenter.js';
import { presentPaginated } from '../presenters/paginated.presenter.js';
import { AuditLogsListQuerySchema, IdParamSchema } from '../schemas/common.schemas.js';

function subjectFromRequest(actorId: string | null): AdminSubject {
  // The admin-auth middleware decorates the request once verified;
  // surfacing it here keeps controller signatures explicit.
  return { actorId: actorId ?? 'admin', isAdmin: true };
}

export const adminRoutes: FastifyPluginAsync = async (app) => {
  // GET /admin/health
  app.get('/health', async (req, reply) => {
    const result = await adminHealthController(app);
    const body = presentAdminHealth(result);
    void req;
    return reply.code(result.status === 'ok' ? 200 : 503).send(body);
  });

  // GET /admin/audit-logs?limit=&offset=&scope=&action=
  app.get('/audit-logs', async (req, reply) => {
    const query = AuditLogsListQuerySchema.parse(req.query ?? {});
    const result = await adminAuditLogsController(
      app,
      {
        ...(query.limit !== undefined ? { limit: query.limit } : {}),
        ...(query.offset !== undefined ? { offset: query.offset } : {}),
        ...(query.scope ? { scope: query.scope } : {}),
        ...(query.action ? { action: query.action } : {}),
      },
      subjectFromRequest(null),
    );
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

  // GET /admin/audit-logs/:id
  app.get('/audit-logs/:id', async (req, reply) => {
    const params = IdParamSchema.parse(req.params ?? {});
    const result = await adminAuditLogDetailController(
      app,
      { id: params.id },
      subjectFromRequest(null),
    );
    if (result.kind === 'not-found') {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: `audit log '${params.id}' not found`,
          requestId: req.id,
        },
      });
    }
    if (result.kind === 'invalid') {
      return reply.code(400).send({
        error: { code: 'INVALID_INPUT', message: result.message, requestId: req.id },
      });
    }
    return reply
      .code(200)
      .send({ data: result.value, retrievedAt: new Date().toISOString(), requestId: req.id });
  });

  // GET /admin/generated-tokens/:id
  app.get('/generated-tokens/:id', async (req, reply) => {
    const params = IdParamSchema.parse(req.params ?? {});
    const result = await adminGeneratedTokenDetailController(app, { id: params.id });
    if (result.kind === 'not-found') {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: `generated token '${params.id}' not found`,
          requestId: req.id,
        },
      });
    }
    if (result.kind === 'invalid') {
      return reply.code(400).send({
        error: { code: 'INVALID_INPUT', message: result.message, requestId: req.id },
      });
    }
    return reply
      .code(200)
      .send({ data: result.value, retrievedAt: new Date().toISOString(), requestId: req.id });
  });

  // GET /admin/resource-reservations/:id
  app.get('/resource-reservations/:id', async (req, reply) => {
    const params = IdParamSchema.parse(req.params ?? {});
    const result = await adminResourceReservationDetailController(app, { id: params.id });
    if (result.kind === 'not-found') {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: `reservation '${params.id}' not found`,
          requestId: req.id,
        },
      });
    }
    if (result.kind === 'invalid') {
      return reply.code(400).send({
        error: { code: 'INVALID_INPUT', message: result.message, requestId: req.id },
      });
    }
    return reply
      .code(200)
      .send({ data: result.value, retrievedAt: new Date().toISOString(), requestId: req.id });
  });
};
