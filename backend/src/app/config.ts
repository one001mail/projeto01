/**
 * Configuration loader.
 *
 * Loads environment variables from `.env` (dev only) and validates them with Zod.
 * Any access to `process.env` outside this module is a bug — import `Config` instead.
 */
import 'dotenv/config';
import { z } from 'zod';

const boolish = z
  .union([z.string(), z.boolean()])
  .transform((v) =>
    typeof v === 'boolean' ? v : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase()),
  );

const ConfigSchema = z.object({
  // runtime
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  HOST: z.string().min(1).default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(8081),

  // cors
  CORS_ORIGINS: z
    .string()
    .default('*')
    .transform((s) =>
      s
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    ),

  // postgres
  DATABASE_URL: z.string().url().default('postgres://app:app@localhost:5432/app'),
  PG_POOL_MAX: z.coerce.number().int().positive().default(10),
  PG_IDLE_TIMEOUT_MS: z.coerce.number().int().nonnegative().default(10_000),

  // redis
  REDIS_URL: z.string().default('redis://localhost:6379/0'),

  // rate limit (parsed by @fastify/rate-limit — string `timeWindow` is supported)
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),

  // request handling
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  BODY_LIMIT_BYTES: z.coerce.number().int().positive().default(1_048_576),

  // logging
  LOG_REDACT_PATHS: z
    .string()
    .default('req.headers.authorization,req.headers.cookie')
    .transform((s) =>
      s
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
    ),
  LOG_RETENTION_DAYS: z.coerce.number().int().nonnegative().default(7),

  // F3 — admin auth (sandbox-only API-key gate for /api/admin/*)
  // Optional: when undefined, admin endpoints fail closed with 503.
  ADMIN_API_KEY: z
    .string()
    .min(1)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),

  // F3 — idempotency middleware
  IDEMPOTENCY_TTL_SECONDS: z.coerce.number().int().positive().default(86_400),

  // F3 — audit-log redaction (dot-paths over the audit payload)
  AUDIT_REDACT_FIELDS: z
    .string()
    .default(
      [
        'body.email',
        'body.message',
        'body.subject',
        'body.password',
        'body.token',
        'body.metadata_minimized',
        'headers.authorization',
        'headers.cookie',
        'headers.x-admin-api-key',
      ].join(','),
    )
    .transform((s) =>
      s
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
    ),

  // F4 — sandbox toggle and in-memory fallbacks
  // When true (preview/dev only), the composition root falls back to
  // in-memory adapters if Postgres/Redis are unreachable. Ignored in
  // production regardless of value.
  SANDBOX_ONLY: boolish.default(false),

  // F4 — background workers (outbox dispatcher, schedulers).
  WORKERS_ENABLED: boolish.default(false),

  // F4 — outbox dispatcher tuning
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(1_000),
  OUTBOX_BATCH_SIZE: z.coerce.number().int().positive().default(50),
  OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OUTBOX_BACKOFF_BASE_MS: z.coerce.number().int().nonnegative().default(250),

  // misc
  PRETTY_LOGS: boolish.default(true),
});

export type Config = z.infer<typeof ConfigSchema>;

let cached: Config | undefined;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  if (cached) return cached;

  const parsed = ConfigSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n  ');
    throw new Error(`Invalid environment configuration:\n  ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

// Test-only: clear the cached config so tests can re-load with a fresh env.
export function _resetConfigForTests(): void {
  cached = undefined;
}
