import { loadConfig } from './app/config.js';
import { registerLifecycle } from './app/lifecycle.js';
/**
 * Process entry point.
 *
 * Responsibilities:
 *   - Build the Fastify app via the composition root in `app/`.
 *   - Start the HTTP listener.
 *   - Wire signal handlers for graceful shutdown.
 *   - Translate uncaught failures into structured logs and a non-zero exit.
 *
 * No business logic lives here.
 */
import { buildServer } from './app/server.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const server = await buildServer(config);

  registerLifecycle(server);

  try {
    await server.listen({ host: config.HOST, port: config.PORT });
  } catch (err) {
    server.log.error({ err }, 'failed to start http listener');
    process.exit(1);
  }
}

main().catch((err) => {
  // Last-resort logger: app logger may not have been built yet.
  // eslint-disable-next-line no-console
  console.error('fatal bootstrap error', err);
  process.exit(1);
});
