import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../../app/build-app.js';
import { _resetConfigForTests, loadConfig } from '../../../app/config.js';
import { AdminHealthResponseSchema } from '../schemas/admin-health.schemas.js';

const ADMIN_KEY = 'test-admin-key-1234567890';

describe('GET /api/admin/health', () => {
  let prevKey: string | undefined;

  beforeEach(() => {
    prevKey = process.env.ADMIN_API_KEY;
    process.env.ADMIN_API_KEY = ADMIN_KEY;
    _resetConfigForTests();
  });

  afterEach(() => {
    if (prevKey === undefined) {
      process.env.ADMIN_API_KEY = undefined;
    } else {
      process.env.ADMIN_API_KEY = prevKey;
    }
    _resetConfigForTests();
  });

  it('returns 401 when the admin API key header is missing', async () => {
    const config = loadConfig();
    const { app } = await buildApp(config);
    try {
      const res = await app.inject({ method: 'GET', url: '/api/admin/health' });
      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe('UNAUTHORIZED');
    } finally {
      await app.close();
    }
  });

  it('returns a valid admin-health envelope when the admin key is provided', async () => {
    const config = loadConfig();
    const { app } = await buildApp(config);

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/admin/health',
        headers: { 'x-admin-api-key': ADMIN_KEY },
      });
      // 200 when everything is up; 503 when pg or redis are down (expected in
      // the sandbox environment with no database). Both are valid responses.
      expect([200, 503]).toContain(res.statusCode);

      const parsed = AdminHealthResponseSchema.safeParse(res.json());
      expect(parsed.success).toBe(true);
      if (!parsed.success) throw new Error(parsed.error.message);

      expect(parsed.data.modules).toEqual(
        expect.arrayContaining(['learning-sessions', 'contact-requests', 'pricing']),
      );
      expect(parsed.data.config.env).toBe(config.NODE_ENV);
      expect(parsed.data.node.pid).toBe(process.pid);
    } finally {
      await app.close();
    }
  });
});
