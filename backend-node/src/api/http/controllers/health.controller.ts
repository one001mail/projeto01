/**
 * Health controller.
 *
 * Coordinates the dependency probes and returns a domain-level result. It
 * does *not* know about HTTP — the route decides status code, the presenter
 * decides JSON shape.
 */
import type { FastifyInstance } from 'fastify';
import { pingRedis } from '../../../infra/cache/redis.js';
import { pingPostgres } from '../../../infra/db/postgres.js';

export interface HealthCheckResult {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  timestamp: string;
  version: string;
  checks: {
    process: 'ok';
    postgres: 'ok' | 'down' | 'skipped';
    redis: 'ok' | 'down' | 'skipped';
  };
}

const APP_VERSION = process.env.npm_package_version ?? '0.1.0';

export async function healthController(app: FastifyInstance): Promise<HealthCheckResult> {
  const [pg, redis] = await Promise.all([pingPostgres(app.log), pingRedis(app.log)]);

  const status: HealthCheckResult['status'] = pg === 'down' || redis === 'down' ? 'degraded' : 'ok';

  return {
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
}
