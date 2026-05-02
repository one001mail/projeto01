/**
 * Pricing routes (calculator endpoints).
 *
 *   GET /api/pricing/quote?currency=BTC&amount=0.05[&delayHours=12]
 *
 * The legacy snapshot endpoint (`GET /api/pricing`) is owned by the
 * pricing module itself and remains available; this file adds the
 * calculator that the front-end calls from the "how it works" widget.
 */
import type { FastifyPluginAsync } from 'fastify';
import { AppError } from '../../../shared/errors/app-error.js';
import { PricingController } from '../controllers/pricing.controller.js';
import { presentOk } from '../presenters/ok.presenter.js';
import { PricingQuoteQuerySchema } from '../schemas/pricing.schemas.js';

export const pricingRoutes: FastifyPluginAsync = async (app) => {
  const registry = app.ctx.useCases.pricing;
  if (!registry) {
    throw AppError.serviceUnavailable(
      'pricing use cases are not registered (pricing module disabled?)',
    );
  }
  const controller = new PricingController(registry);

  app.get('/pricing/quote', async (req, reply) => {
    const query = PricingQuoteQuerySchema.parse(req.query ?? {});
    const dto = await controller.quote(query);
    reply.header('Cache-Control', 'public, max-age=15');
    return reply.code(200).send(presentOk(dto, req.id));
  });
};
