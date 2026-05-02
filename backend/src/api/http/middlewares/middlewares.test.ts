/**
 * F3 — cross-cutting HTTP middlewares: integration tests.
 *
 * Each test builds a minimal Fastify app, decorates it with a fake
 * `AppContext` containing in-memory adapters, then exercises one
 * middleware end-to-end via `app.inject()`. No Postgres, no Redis.
 */
import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import type { AppContext } from '../../../app/app-context.js';
import type { Config } from '../../../app/config.js';
import { InMemoryAuditLogStore } from '../../../infra/audit/in-memory-audit-log.store.js';
import { InMemoryIdempotencyStore } from '../../../infra/idempotency/in-memory-idempotency.store.js';
import { registerErrorHandler } from '../error-handler.js';
import { adminAuthMiddleware } from './admin-auth.middleware.js';
import { auditLogMiddleware } from './audit-log.middleware.js';
import { idempotencyMiddleware } from './idempotency.middleware.js';

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

function makeTestConfig(overrides: Partial<Config> = {}): Config {
  return {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    HOST: '127.0.0.1',
    PORT: 0,
    CORS_ORIGINS: ['*'],
    DATABASE_URL: 'postgres://app:app@localhost:5432/app',
    PG_POOL_MAX: 10,
    PG_IDLE_TIMEOUT_MS: 10_000,
    REDIS_URL: 'redis://localhost:6379/0',
    RATE_LIMIT_MAX: 120,
    RATE_LIMIT_WINDOW: '1 minute',
    REQUEST_TIMEOUT_MS: 15_000,
    BODY_LIMIT_BYTES: 1_048_576,
    LOG_REDACT_PATHS: ['req.headers.authorization', 'req.headers.cookie'],
    LOG_RETENTION_DAYS: 7,
    PRETTY_LOGS: false,
    ADMIN_API_KEY: undefined,
    IDEMPOTENCY_TTL_SECONDS: 86_400,
    AUDIT_REDACT_FIELDS: [
      'body.email',
      'body.message',
      'body.subject',
      'headers.authorization',
      'headers.cookie',
      'headers.x-admin-api-key',
    ],
    ...overrides,
  } as Config;
}

interface HarnessOpts {
  config?: Partial<Config>;
  idempotency?: InMemoryIdempotencyStore;
  auditLog?: InMemoryAuditLogStore;
}

interface Harness {
  app: FastifyInstance;
  idempotency: InMemoryIdempotencyStore;
  auditLog: InMemoryAuditLogStore;
  config: Config;
}

async function buildHarness(opts: HarnessOpts = {}): Promise<Harness> {
  const idempotency = opts.idempotency ?? new InMemoryIdempotencyStore();
  const auditLog = opts.auditLog ?? new InMemoryAuditLogStore();
  const config = makeTestConfig(opts.config);

  const app = Fastify({ logger: false, genReqId: () => 'test-req-id' });
  registerErrorHandler(app);

  // Decorate ctx — we only need fields the middlewares actually read.
  const ctx = { config, idempotency, auditLog } as unknown as AppContext;
  app.decorate('ctx', ctx);

  return { app, idempotency, auditLog, config };
}

// Each test owns its app; close on teardown.
let harnessRefs: FastifyInstance[] = [];
function track(app: FastifyInstance) {
  harnessRefs.push(app);
  return app;
}
afterEach(async () => {
  await Promise.all(harnessRefs.map((a) => a.close().catch(() => undefined)));
  harnessRefs = [];
});

// ===========================================================================
// Idempotency middleware
// ===========================================================================
describe('idempotency.middleware', () => {
  it('returns the cached response on repeated key+body, without duplicating effects', async () => {
    const h = await buildHarness();
    track(h.app);

    let handlerInvocations = 0;
    await h.app.register(
      async (api) => {
        await api.register(idempotencyMiddleware, { ttlSeconds: 600 });
        api.post('/things', async (_req, reply) => {
          handlerInvocations += 1;
          return reply.code(201).send({ ok: true, n: handlerInvocations });
        });
      },
      { prefix: '/api' },
    );
    await h.app.ready();

    const first = await h.app.inject({
      method: 'POST',
      url: '/api/things',
      headers: { 'idempotency-key': 'abc-123', 'content-type': 'application/json' },
      payload: { foo: 'bar' },
    });
    expect(first.statusCode).toBe(201);
    expect(first.json()).toEqual({ ok: true, n: 1 });
    expect(first.headers['idempotent-replay']).toBeUndefined();

    const second = await h.app.inject({
      method: 'POST',
      url: '/api/things',
      headers: { 'idempotency-key': 'abc-123', 'content-type': 'application/json' },
      payload: { foo: 'bar' },
    });
    expect(second.statusCode).toBe(201);
    expect(second.json()).toEqual({ ok: true, n: 1 }); // SAME body, SAME n
    expect(second.headers['idempotent-replay']).toBe('true');

    expect(handlerInvocations).toBe(1); // <-- no duplicated effects
    expect(h.idempotency.size()).toBe(1);
  });

  it('returns 409 CONFLICT when the same key is reused with a different payload', async () => {
    const h = await buildHarness();
    track(h.app);

    await h.app.register(
      async (api) => {
        await api.register(idempotencyMiddleware);
        api.post('/things', async (_req, reply) => reply.code(201).send({ ok: true }));
      },
      { prefix: '/api' },
    );
    await h.app.ready();

    const first = await h.app.inject({
      method: 'POST',
      url: '/api/things',
      headers: { 'idempotency-key': 'k1', 'content-type': 'application/json' },
      payload: { x: 1 },
    });
    expect(first.statusCode).toBe(201);

    const conflict = await h.app.inject({
      method: 'POST',
      url: '/api/things',
      headers: { 'idempotency-key': 'k1', 'content-type': 'application/json' },
      payload: { x: 2 },
    });
    expect(conflict.statusCode).toBe(409);
    expect(conflict.json().error.code).toBe('CONFLICT');
    expect(conflict.json().error.details.code).toBe('IDEMPOTENCY_KEY_MISMATCH');
  });

  it('passes through normally when no Idempotency-Key header is present', async () => {
    const h = await buildHarness();
    track(h.app);

    let invocations = 0;
    await h.app.register(
      async (api) => {
        await api.register(idempotencyMiddleware);
        api.post('/things', async (_req, reply) => {
          invocations += 1;
          return reply.code(201).send({ n: invocations });
        });
      },
      { prefix: '/api' },
    );
    await h.app.ready();

    const r1 = await h.app.inject({ method: 'POST', url: '/api/things', payload: {} });
    const r2 = await h.app.inject({ method: 'POST', url: '/api/things', payload: {} });
    expect(r1.json()).toEqual({ n: 1 });
    expect(r2.json()).toEqual({ n: 2 });
    expect(h.idempotency.size()).toBe(0);
  });

  it('does NOT cache 4xx/5xx responses', async () => {
    const h = await buildHarness();
    track(h.app);

    await h.app.register(
      async (api) => {
        await api.register(idempotencyMiddleware);
        api.post('/fail', async (_req, reply) => reply.code(422).send({ bad: true }));
      },
      { prefix: '/api' },
    );
    await h.app.ready();

    const r = await h.app.inject({
      method: 'POST',
      url: '/api/fail',
      headers: { 'idempotency-key': 'fail-1', 'content-type': 'application/json' },
      payload: {},
    });
    expect(r.statusCode).toBe(422);
    expect(h.idempotency.size()).toBe(0);
  });
});

// ===========================================================================
// Audit-log middleware
// ===========================================================================
describe('audit-log.middleware', () => {
  it('records exactly one redacted entry per successful mutating request', async () => {
    const h = await buildHarness();
    track(h.app);

    await h.app.register(auditLogMiddleware);
    h.app.post('/api/contact', async (_req, reply) =>
      reply.code(201).send({ id: 'c1', status: 'received' }),
    );
    h.app.get('/api/healthz', async (_req, reply) => reply.code(200).send({ ok: true }));
    await h.app.ready();

    const r = await h.app.inject({
      method: 'POST',
      url: '/api/contact',
      headers: { 'content-type': 'application/json', authorization: 'Bearer leakme' },
      payload: { email: 'someone@example.com', message: 'I need help' },
    });
    expect(r.statusCode).toBe(201);

    // GET requests must NOT be audited.
    await h.app.inject({ method: 'GET', url: '/api/healthz' });

    expect(h.auditLog.records).toHaveLength(1);
    const rec = h.auditLog.records[0];
    if (!rec) throw new Error('expected one audit record');
    expect(rec.scope).toBe('http');
    expect(rec.action).toBe('POST /api/contact');
    expect(rec.requestId).toBe('test-req-id');

    // The body fields configured in AUDIT_REDACT_FIELDS must be masked.
    const body = rec.redactedPayload.body as Record<string, unknown>;
    expect(body.email).toBe('<redacted>');
    expect(body.message).toBe('<redacted>');

    // Sensitive header is dropped at the SAFE_HEADER allowlist; not even
    // the redacted placeholder is leaked.
    const headers = rec.redactedPayload.headers as Record<string, unknown>;
    expect(headers.authorization).toBeUndefined();
  });

  it('does not record on 4xx outcomes', async () => {
    const h = await buildHarness();
    track(h.app);

    await h.app.register(auditLogMiddleware);
    h.app.post('/api/explode', async (_req, reply) => reply.code(422).send({ bad: true }));
    await h.app.ready();

    await h.app.inject({ method: 'POST', url: '/api/explode', payload: {} });
    expect(h.auditLog.records).toHaveLength(0);
  });
});

// ===========================================================================
// Admin-auth middleware
// ===========================================================================
describe('admin-auth.middleware', () => {
  it('returns 503 when ADMIN_API_KEY is not configured', async () => {
    const h = await buildHarness({ config: { ADMIN_API_KEY: undefined } });
    track(h.app);

    await h.app.register(
      async (api) => {
        await api.register(adminAuthMiddleware);
        api.get('/admin/health', async (_req, reply) => reply.code(200).send({ ok: true }));
      },
      { prefix: '/api' },
    );
    await h.app.ready();

    const r = await h.app.inject({
      method: 'GET',
      url: '/api/admin/health',
      headers: { 'x-admin-api-key': 'whatever' },
    });
    expect(r.statusCode).toBe(503);
    expect(r.json().error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('returns 401 when ADMIN_API_KEY is configured but header is missing', async () => {
    const h = await buildHarness({ config: { ADMIN_API_KEY: 'expected-key' } });
    track(h.app);

    await h.app.register(
      async (api) => {
        await api.register(adminAuthMiddleware);
        api.get('/admin/health', async (_req, reply) => reply.code(200).send({ ok: true }));
      },
      { prefix: '/api' },
    );
    await h.app.ready();

    const noHeader = await h.app.inject({ method: 'GET', url: '/api/admin/health' });
    expect(noHeader.statusCode).toBe(401);
    expect(noHeader.json().error.code).toBe('UNAUTHORIZED');

    const wrong = await h.app.inject({
      method: 'GET',
      url: '/api/admin/health',
      headers: { 'x-admin-api-key': 'wrong-key' },
    });
    expect(wrong.statusCode).toBe(401);
  });

  it('returns 200 when ADMIN_API_KEY is configured and header matches', async () => {
    const h = await buildHarness({ config: { ADMIN_API_KEY: 'expected-key' } });
    track(h.app);

    await h.app.register(
      async (api) => {
        await api.register(adminAuthMiddleware);
        api.get('/admin/health', async (req, reply) =>
          reply.code(200).send({ ok: true, actor: req.actorId }),
        );
      },
      { prefix: '/api' },
    );
    await h.app.ready();

    const ok = await h.app.inject({
      method: 'GET',
      url: '/api/admin/health',
      headers: { 'x-admin-api-key': 'expected-key' },
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toEqual({ ok: true, actor: 'admin-api-key' });
  });
});
