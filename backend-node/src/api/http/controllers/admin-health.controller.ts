/**
 * Admin health controller.
 *
 * Runs the same dependency probes as the public health route, then enriches
 * the result with operator-relevant metadata. Pure — no HTTP knowledge.
 */
import type { FastifyInstance } from 'fastify';
import { listRegisteredModules } from '../../../app/register-modules.js';
import { pingRedis } from '../../../infra/cache/redis.js';
import { pingPostgres } from '../../../infra/db/postgres.js';

export interface AdminHealthResult {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  timestamp: string;
  version: string;
  node: {
    version: string;
    platform: string;
    arch: string;
    pid: number;
  };
  checks: {
    process: 'ok';
    postgres: 'ok' | 'down' | 'skipped';
    redis: 'ok' | 'down' | 'skipped';
  };
  modules: string[];
  config: {
    env: string;
    logLevel: string;
    requestTimeoutMs: number;
    rateLimitMax: number;
    rateLimitWindow: string;
    bodyLimitBytes: number;
  };
}

const APP_VERSION = process.env.npm_package_version ?? '0.1.0';

export async function adminHealthController(app: FastifyInstance): Promise<AdminHealthResult> {
  const [pg, redis] = await Promise.all([pingPostgres(app.log), pingRedis(app.log)]);

  const status: AdminHealthResult['status'] = pg === 'down' || redis === 'down' ? 'degraded' : 'ok';
  const cfg = app.ctx.config;

  return {
    status,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    node: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
    },
    checks: { process: 'ok', postgres: pg, redis },
    modules: [...listRegisteredModules()],
    config: {
      env: cfg.NODE_ENV,
      logLevel: cfg.LOG_LEVEL,
      requestTimeoutMs: cfg.REQUEST_TIMEOUT_MS,
      rateLimitMax: cfg.RATE_LIMIT_MAX,
      rateLimitWindow: cfg.RATE_LIMIT_WINDOW,
      bodyLimitBytes: cfg.BODY_LIMIT_BYTES,
    },
  };
}
