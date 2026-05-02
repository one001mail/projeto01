import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { registerErrorHandler } from '../../api/http/error-handler.js';
import { makeFixedClock } from '../../shared/application/testing/fakes.js';
import { GetPricingUseCase } from './application/get-pricing.use-case.js';
import { makePricingRoutes } from './infra/http/routes.js';

async function buildTestApp() {
  const app = Fastify({ logger: false });
  registerErrorHandler(app);
  return app;
}

describe('get-pricing use case', () => {
  it('returns the current pricing snapshot and a timestamp', async () => {
    const uc = new GetPricingUseCase({ clock: makeFixedClock('2025-07-01T00:00:00.000Z') });
    const result = await uc.execute();
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');
    expect(result.value.retrievedAt).toBe('2025-07-01T00:00:00.000Z');
    expect(result.value.pricing.currencies).toContain('BTC');
    expect(result.value.pricing.feeBps).toBeGreaterThan(0);
    expect(result.value.pricing.minAmounts.BTC).toBeGreaterThan(0);
    expect(result.value.pricing.delayOptionsHours.length).toBeGreaterThan(0);
  });
});

describe('pricing HTTP route', () => {
  it('GET /api/pricing returns 200 with envelope and cache header', async () => {
    const uc = new GetPricingUseCase({ clock: makeFixedClock() });
    const app = await buildTestApp();
    await app.register(
      async (api) => {
        await api.register(makePricingRoutes({ getUc: uc }));
      },
      { prefix: '/api' },
    );
    await app.ready();
    try {
      const res = await app.inject({ method: 'GET', url: '/api/pricing' });
      expect(res.statusCode).toBe(200);
      expect(res.headers['cache-control']).toContain('max-age=60');
      const body = res.json() as {
        pricing: { currencies: string[]; feeBps: number; disclaimer: string };
        retrievedAt: string;
      };
      expect(body.pricing.currencies).toEqual(expect.arrayContaining(['BTC', 'ETH', 'USDT']));
      expect(body.pricing.feeBps).toBe(100);
      expect(typeof body.retrievedAt).toBe('string');
    } finally {
      await app.close();
    }
  });
});
