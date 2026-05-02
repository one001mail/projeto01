import { describe, expect, it } from 'vitest';
import { buildApp } from '../../../app/build-app.js';
import { _resetConfigForTests, loadConfig } from '../../../app/config.js';
import { AdminHealthResponseSchema } from '../schemas/admin-health.schemas.js';

describe('GET /api/admin/health', () => {
  it('returns a valid admin-health envelope that includes the new modules', async () => {
    _resetConfigForTests();
    const config = loadConfig();
    const { app } = await buildApp(config);

    try {
      const res = await app.inject({ method: 'GET', url: '/api/admin/health' });
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
