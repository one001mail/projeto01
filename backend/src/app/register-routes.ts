/**
 * HTTP route registration.
 *
 * Mounts the canonical HTTP surface defined under `src/api/http/routes/`.
 * Domain modules register their *own* legacy routes via
 * `register-modules.ts`; this file owns the shared/public surface.
 *
 * Ordering contract (enforced by `build-app.ts`):
 *
 *   plugins → modules → registerRoutes
 *
 * `registerModules` populates `app.ctx.useCases.{mixSession,contact,pricing}`
 * via use-case ports. The shared routes below consume those ports through
 * the registry; they would throw `SERVICE_UNAVAILABLE` if invoked before
 * the modules have registered, hence the strict ordering.
 *
 * Routes wired here:
 *   - GET    /health                        (public liveness)
 *   - POST   /api/mix-sessions              (sandbox-only, idempotent)
 *   - GET    /api/mix-sessions/:id          (sandbox-only)
 *   - POST   /api/contact                   (idempotent)
 *   - GET    /api/pricing/quote             (calculator)
 *   - GET    /api/admin/health              (admin-gated)
 *   - GET    /api/admin/audit-logs          (admin-gated, paginated)
 */
import type { FastifyInstance } from 'fastify';
import { adminAuthMiddleware } from '../api/http/middlewares/admin-auth.middleware.js';
import { adminRoutes } from '../api/http/routes/admin.routes.js';
import { contactRoutes } from '../api/http/routes/contact.routes.js';
import { healthRoutes } from '../api/http/routes/health.routes.js';
import { mixSessionRoutes } from '../api/http/routes/mix-session.routes.js';
import { pricingRoutes } from '../api/http/routes/pricing.routes.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Public liveness — root, no /api prefix.
  await app.register(healthRoutes);

  // Public, sandbox/educational surface under /api.
  await app.register(
    async (api) => {
      await api.register(mixSessionRoutes);
      await api.register(contactRoutes);
      await api.register(pricingRoutes);

      // Admin surface — gated by admin-auth.
      await api.register(
        async (admin) => {
          await admin.register(adminAuthMiddleware);
          await admin.register(adminRoutes);
        },
        { prefix: '/admin' },
      );
    },
    { prefix: '/api' },
  );
}
