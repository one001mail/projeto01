import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
/**
 * Fastify plugin registration.
 *
 * Registers framework-level plugins (security, parsing, observability) and
 * the global error handler. Domain logic must NOT leak into this file.
 *
 * Order matters:
 *   1. sensible / helmet / cors / rate-limit  — security & ergonomics
 *   2. registerErrorHandler                   — must precede routes
 *   3. auditLogMiddleware                     — must be registered before
 *      any route so its onResponse hook fires after every reply (Fastify
 *      hooks added later only apply to routes added even later).
 */
import type { FastifyInstance } from 'fastify';
import { registerErrorHandler } from '../api/http/error-handler.js';
import { auditLogMiddleware } from '../api/http/middlewares/audit-log.middleware.js';
import type { Config } from './config.js';

export async function registerPlugins(app: FastifyInstance, config: Config): Promise<void> {
  await app.register(sensible);

  await app.register(helmet, {
    // API-only: no scripts served, lock CSP down.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-origin' },
  });

  await app.register(cors, {
    origin:
      config.CORS_ORIGINS.length === 1 && config.CORS_ORIGINS[0] === '*'
        ? true
        : config.CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
  });

  // Error handler must be registered before routes/modules.
  registerErrorHandler(app);

  // Audit-log middleware: global onResponse hook for mutating verbs.
  await app.register(auditLogMiddleware);
}
