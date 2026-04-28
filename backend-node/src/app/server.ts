import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
/**
 * Composition root.
 *
 * Builds a fully wired Fastify instance with logger, core plugins, the global
 * error handler, and API routes. The returned server is built but not yet
 * listening — callers (`index.ts` / tests) decide between `.listen()` and
 * `.inject()`.
 */
import Fastify, { type FastifyInstance } from 'fastify';
import { registerApi } from '../api/index.js';
import { buildLoggerOptions } from '../infra/logging/logger.js';
import { registerErrorHandler } from '../shared/errors/error-handler.js';
import type { Config } from './config.js';

export async function buildServer(config: Config): Promise<FastifyInstance> {
  const app = Fastify({
    logger: buildLoggerOptions(config),
    disableRequestLogging: false,
    bodyLimit: config.BODY_LIMIT_BYTES,
    requestTimeout: config.REQUEST_TIMEOUT_MS,
    trustProxy: true,
    genReqId: () => crypto.randomUUID(),
  });

  // ------- core plugins -------
  await app.register(sensible);

  await app.register(helmet, {
    // CSP is API-only: no scripts served, lock it down.
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

  // ------- error handler (must be registered before routes) -------
  registerErrorHandler(app);

  // ------- routes -------
  await app.register(registerApi);

  app.log.info(
    {
      env: config.NODE_ENV,
      host: config.HOST,
      port: config.PORT,
      cors: config.CORS_ORIGINS,
    },
    'server built',
  );

  return app;
}
