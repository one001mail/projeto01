/**
 * Process entry point.
 *
 * Builds the application via the composition root, starts the HTTP listener,
 * and wires signal handlers for graceful shutdown.
 */
import { buildApp } from './app/build-app.js';
import { loadConfig } from './app/config.js';
import { registerLifecycle } from './app/lifecycle.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const { app } = await buildApp(config);

  registerLifecycle(app);

  try {
    await app.listen({ host: config.HOST, port: config.PORT });
  } catch (err) {
    app.log.error({ err }, 'failed to start http listener');
    process.exit(1);
  }
}

main().catch((err) => {
  // biome-ignore lint/suspicious/noConsole: app logger is not yet built here.
  console.error('fatal bootstrap error', err);
  process.exit(1);
});
