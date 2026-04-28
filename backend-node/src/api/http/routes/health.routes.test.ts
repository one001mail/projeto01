import { afterAll, describe, expect, it } from 'vitest';
import { _resetConfigForTests, loadConfig } from '../../../app/config.js';
import { buildApp } from '../../../app/build-app.js';

describe('GET /health', () => {
  afterAll(() => {
    _resetConfigForTests();
  });

  it('returns a structured health payload', async () => {
    const config = loadConfig();
    const { app } = await buildApp(config);

    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);

    const body = res.json() as {
      status: string;
      uptimeSeconds: number;
      timestamp: string;
      version: string;
      checks: { process: string; postgres: string; redis: string };
    };

    expect(['ok', 'degraded']).toContain(body.status);
    expect(body.checks.process).toBe('ok');
    expect(['ok', 'down', 'skipped']).toContain(body.checks.postgres);
    expect(['ok', 'down', 'skipped']).toContain(body.checks.redis);
    expect(typeof body.uptimeSeconds).toBe('number');
    expect(typeof body.timestamp).toBe('string');

    await app.close(); // triggers container.dispose() via onClose hook
  });

  it('returns 404 envelope for unknown routes', async () => {
    const { app } = await buildApp(loadConfig());
    const res = await app.inject({ method: 'GET', url: '/does-not-exist' });
    expect(res.statusCode).toBe(404);
    const body = res.json() as { error: { code: string; requestId: string } };
    expect(body.error.code).toBe('NOT_FOUND');
    expect(typeof body.error.requestId).toBe('string');
    await app.close();
  });
});
