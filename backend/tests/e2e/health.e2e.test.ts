/**
 * End-to-end test for the public health endpoint.
 *
 * Boots the real Fastify instance via `buildApp` (composition root) and hits
 * `GET /health` with `inject()`. The test relies on the sandbox fallback so
 * it does not require Postgres/Redis to be reachable.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type BuiltApp, buildApp } from '../../src/app/build-app.js';
import { _resetConfigForTests, loadConfig } from '../../src/app/config.js';

describe('e2e: GET /health', () => {
  let built: BuiltApp;

  beforeAll(async () => {
    _resetConfigForTests();
    process.env.NODE_ENV = 'test';
    process.env.SANDBOX_ONLY = 'true';
    process.env.WORKERS_ENABLED = 'false';
    process.env.PRETTY_LOGS = 'false';
    process.env.LOG_LEVEL = 'silent';
    // Force PG probe failure so we land in the in-memory fallback.
    process.env.DATABASE_URL = 'postgres://nobody:nobody@127.0.0.1:1/nobody';
    process.env.REDIS_URL = 'redis://127.0.0.1:1/0';
    const config = loadConfig();
    built = await buildApp(config);
  }, 30_000);

  afterAll(async () => {
    await built.app.close();
  });

  it('returns 200 with a JSON envelope', async () => {
    const res = await built.app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as Record<string, unknown>;
    expect(body).toMatchObject({
      status: expect.any(String),
      uptimeSeconds: expect.any(Number),
      checks: expect.any(Object),
    });
  });
});
