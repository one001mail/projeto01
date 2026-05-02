/**
 * Pricing module composition root.
 */
import type { FastifyInstance } from 'fastify';
import { SystemClock } from '../../shared/application/ports/clock.port.js';
import { GetPricingUseCase } from './application/get-pricing.use-case.js';
import { makePricingRoutes } from './infra/http/routes.js';

export async function registerPricingModule(app: FastifyInstance): Promise<void> {
  const getUc = new GetPricingUseCase({ clock: new SystemClock() });

  // Expose for the shared HTTP layer via ports.
  app.ctx.useCases.pricing = { get: getUc };

  await app.register(
    async (api) => {
      await api.register(makePricingRoutes({ getUc }));
    },
    { prefix: '/api' },
  );

  app.log.debug({ module: 'pricing' }, 'pricing module ready');
}
