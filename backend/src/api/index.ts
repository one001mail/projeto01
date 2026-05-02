/**
 * Public barrel for the HTTP adapter layer.
 *
 * Exposes the canonical building blocks consumed by the composition root
 * and tests. Internal helpers (controllers, route plugins) are imported
 * directly from their modules; this barrel only surfaces the public seams.
 */
export { registerErrorHandler } from './http/error-handler.js';
export { authMiddleware } from './http/middlewares/auth.middleware.js';
export { adminAuthMiddleware } from './http/middlewares/admin-auth.middleware.js';
export { auditLogMiddleware } from './http/middlewares/audit-log.middleware.js';
export { idempotencyMiddleware } from './http/middlewares/idempotency.middleware.js';
export { requestContextMiddleware } from './http/middlewares/request-context.middleware.js';
export { rateLimitMiddleware } from './http/middlewares/rate-limit.middleware.js';
export { errorHandlerPlugin } from './http/middlewares/error-handler.middleware.js';

export { healthRoutes } from './http/routes/health.routes.js';
export { mixSessionRoutes } from './http/routes/mix-session.routes.js';
export { contactRoutes } from './http/routes/contact.routes.js';
export { pricingRoutes } from './http/routes/pricing.routes.js';
export { adminRoutes } from './http/routes/admin.routes.js';
