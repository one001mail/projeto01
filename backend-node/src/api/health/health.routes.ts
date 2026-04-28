/**
 * Health endpoint.
 *
 * Reports liveness ("is the process alive?") and readiness ("are dependencies
 * reachable?"). Always returns 200 for liveness; readiness is reflected in the
 * payload so orchestrators can pick the probe they need.
 */
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { pingRedis } from '../../infra/cache/redis.js';
import { pingPostgres } from '../../infra/db/postgres.js';

const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  uptimeSeconds: z.number(),
  timestamp: z.string(),
  version: z.string(),
  checks: z.object({
    process: z.literal('ok'),
    postgres: z.enum(['ok', 'down', 'skipped']),
    redis: z.enum(['ok', 'down', 'skipped']),
  }),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

const APP_VERSION = process.env.npm_package_version ?? '0.1.0';

export const healthRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/health', async (_req, reply) => {
    const [pg, redis] = await Promise.all([pingPostgres(app.log), pingRedis(app.log)]);

    const status: HealthResponse['status'] = pg === 'down' || redis === 'down' ? 'degraded' : 'ok';

    const body: HealthResponse = {
      status,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      version: APP_VERSION,
      checks: {
        process: 'ok',
        postgres: pg,
        redis,
      },
    };

    return reply.code(200).send(body);
  });
};
