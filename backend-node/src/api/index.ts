/**
 * API composition: registers all HTTP routes under their respective prefixes.
 * Defined as a Fastify plugin so generics stay compatible with the parent
 * server's logger / type-provider.
 */
import type { FastifyPluginAsync } from 'fastify';
import { healthRoutes } from './health/health.routes.js';

export const registerApi: FastifyPluginAsync = async (app) => {
  await app.register(healthRoutes); // GET /health
  // Future: await app.register(mixSessionRoutes, { prefix: '/mix-session' });
  // Future: await app.register(pricingRoutes, { prefix: '/pricing' });
  // Future: await app.register(contactRoutes, { prefix: '/contact' });
  // Future: await app.register(adminRoutes, { prefix: '/admin' });
};
