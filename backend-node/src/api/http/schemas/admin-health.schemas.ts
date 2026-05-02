/**
 * Admin health response schema (Zod).
 *
 * Superset of the public `/health` payload. Surfaces extra diagnostic info
 * intended for operators (registered modules, node/platform, a redacted
 * config summary). Not authenticated yet — gateway should restrict access.
 */
import { z } from 'zod';
import { HealthCheckSchema } from './health.schemas.js';

export const AdminHealthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  uptimeSeconds: z.number().nonnegative(),
  timestamp: z.string(),
  version: z.string(),
  node: z.object({
    version: z.string(),
    platform: z.string(),
    arch: z.string(),
    pid: z.number().int().nonnegative(),
  }),
  checks: z.object({
    process: z.literal('ok'),
    postgres: HealthCheckSchema,
    redis: HealthCheckSchema,
  }),
  modules: z.array(z.string()),
  config: z.object({
    env: z.string(),
    logLevel: z.string(),
    requestTimeoutMs: z.number().int().positive(),
    rateLimitMax: z.number().int().positive(),
    rateLimitWindow: z.string(),
    bodyLimitBytes: z.number().int().positive(),
  }),
});

export type AdminHealthResponse = z.infer<typeof AdminHealthResponseSchema>;
