/**
 * Auth middleware (Fastify plugin).
 *
 * Sandbox-only contract: the only authenticated principal in this preview
 * is the operator using the `X-Admin-API-Key` header. We re-export the
 * `adminAuthMiddleware` under a more conventional name so route files
 * can read `app.register(authMiddleware)` without imports leaking
 * implementation details.
 *
 * When real authentication (sessions, OAuth, JWT, ...) is introduced,
 * this file is the seam where the resolver should be plugged in. Until
 * then, calling `authMiddleware` is equivalent to calling the admin gate.
 */
export { adminAuthMiddleware as authMiddleware } from './admin-auth.middleware.js';
