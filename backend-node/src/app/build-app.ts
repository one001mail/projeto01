/**
 * Build Application (composition root).
 *
 * Steps, in order:
 *   1. Build the dependency container (infra adapters).
 *   2. Construct the Fastify instance with logger + framework options.
 *   3. Attach the AppContext so every layer below can resolve dependencies.
 *   4. Register Fastify plugins (security, error handler).
 *   5. Register HTTP routes (system-level).
 *   6. Register domain modules (own routes + event handlers).
 *   7. Wire `onClose` so closing the app disposes the container.
 *
 * The result is a built-but-not-listening Fastify instance plus the
 * container reference, useful for test cleanup.
 */
import Fastify, { type FastifyInstance } from 'fastify';
import type { Config } from './config.js';
import { buildLoggerOptions } from '../infra/logging/logger.js';
import { attachAppContext } from './app-context.js';
import { type Container, createContainer } from './dependency-container.js';
import { registerPlugins } from './register-plugins.js';
import { registerRoutes } from './register-routes.js';
import { registerModules } from './register-modules.js';

export interface BuiltApp {
  app: FastifyInstance;
  container: Container;
}

export async function buildApp(config: Config): Promise<BuiltApp> {
  // 1. Container (cheap; no I/O until pinged)
  const container = createContainer(config);

  // 2. Fastify
  const app = Fastify({
    logger: buildLoggerOptions(config),
    disableRequestLogging: false,
    bodyLimit: config.BODY_LIMIT_BYTES,
    requestTimeout: config.REQUEST_TIMEOUT_MS,
    trustProxy: true,
    genReqId: () => crypto.randomUUID(),
  });

  // 3. Attach context (decorate before any route reads `app.ctx`)
  attachAppContext(app, container);

  // 4-6. Plugins, system routes, modules
  await registerPlugins(app, config);
  await registerRoutes(app);
  await registerModules(app);

  // 7. Container disposal hook
  app.addHook('onClose', async () => {
    await container.dispose();
  });

  app.log.info(
    {
      env: config.NODE_ENV,
      host: config.HOST,
      port: config.PORT,
      cors: config.CORS_ORIGINS,
    },
    'application built',
  );

  return { app, container };
}
