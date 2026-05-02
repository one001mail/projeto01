/**
 * Process lifecycle: graceful shutdown + uncaught error capture.
 *
 * Listens for SIGINT / SIGTERM, drains in-flight requests via Fastify's
 * `close()`, then exits. Any uncaught exception or unhandled rejection is
 * logged and triggers a clean shutdown with a non-zero exit code.
 */
import type { FastifyInstance } from 'fastify';

const SHUTDOWN_TIMEOUT_MS = 10_000;

export function registerLifecycle(app: FastifyInstance): void {
  let shuttingDown = false;

  const shutdown = async (signal: string, exitCode = 0): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    app.log.info({ signal }, 'shutdown initiated');

    const force = setTimeout(() => {
      app.log.error('shutdown timed out, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    force.unref();

    try {
      await app.close();
      app.log.info('shutdown complete');
      process.exit(exitCode);
    } catch (err) {
      app.log.error({ err }, 'error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  process.on('uncaughtException', (err) => {
    app.log.fatal({ err }, 'uncaughtException');
    void shutdown('uncaughtException', 1);
  });
  process.on('unhandledRejection', (reason) => {
    app.log.fatal({ err: reason }, 'unhandledRejection');
    void shutdown('unhandledRejection', 1);
  });
}
