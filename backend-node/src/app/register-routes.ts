/**
 * HTTP route registration.
 *
 * Registers the API surface defined under `src/api/http/routes/`. This file is
 * intentionally thin — routes themselves live in their own files; we only
 * compose them here so the wiring is discoverable from the composition root.
 *
 * Domain modules register their *own* routes via `register-modules.ts` (they
 * own their HTTP surface together with their domain). System routes (health,
 * etc.) live here and are framework-level concerns.
 */
import type { FastifyInstance } from 'fastify';
import { adminHealthRoutes } from '../api/http/routes/admin-health.routes.js';
import { healthRoutes } from '../api/http/routes/health.routes.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes); // GET /health (public, root)
  // System routes under /api
  await app.register(
    async (api) => {
      await api.register(adminHealthRoutes); // GET /api/admin/health
    },
    { prefix: '/api' },
  );
}
