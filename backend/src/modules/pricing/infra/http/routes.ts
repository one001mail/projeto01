/**
 * Pricing routes.
 */
import type { FastifyPluginAsync } from 'fastify';
import type { GetPricingUseCase } from '../../application/get-pricing.use-case.js';
import { PricingController } from './controller.js';
import { presentPricing } from './presenter.js';

export interface PricingRoutesDeps {
  getUc: GetPricingUseCase;
}

export function makePricingRoutes(deps: PricingRoutesDeps): FastifyPluginAsync {
  const controller = new PricingController(deps);

  return async (app) => {
    app.get('/pricing', async (_req, reply) => {
      const result = await controller.get();
      reply.header('Cache-Control', 'public, max-age=60');
      return reply.code(200).send(presentPricing(result));
    });
  };
}
