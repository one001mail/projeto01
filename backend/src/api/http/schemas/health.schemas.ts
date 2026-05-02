/**
 * Health response schemas (Zod).
 *
 * The schema is exported alongside its inferred type so controllers and
 * tests can share a single source of truth for the response contract.
 */
import { z } from 'zod';

export const HealthCheckSchema = z.enum(['ok', 'down', 'skipped']);

export const HealthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  uptimeSeconds: z.number().nonnegative(),
  timestamp: z.string(),
  version: z.string(),
  checks: z.object({
    process: z.literal('ok'),
    postgres: HealthCheckSchema,
    redis: HealthCheckSchema,
  }),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
