/**
 * Fastify plugin registration.
 *
 * Registers framework-level plugins (security, parsing, observability) and
 * the global error handler. Domain logic must NOT leak into this file.
 *
 * Order matters: the error handler is attached *before* routes so it can
 * intercept everything routes throw.
 */
import type { FastifyInstance } from 'fastify';
import sensible from '@fastify/sensible';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import type { Config } from './config.js';
import { registerErrorHandler } from '../shared/errors/error-handler.js';

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

  // Error handler must be registered before routes/modules.
  registerErrorHandler(app);
}
