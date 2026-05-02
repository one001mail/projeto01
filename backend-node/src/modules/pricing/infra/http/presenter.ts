/**
 * Pricing HTTP presenter.
 */
import type { GetPricingResult } from '../../application/get-pricing.use-case.js';
import type { PricingEnvelope } from './schemas.js';

export function presentPricing(result: GetPricingResult): PricingEnvelope {
  const { pricing } = result;
  return {
    pricing: {
      currencies: [...pricing.currencies],
      feeBps: pricing.feeBps,
      minAmounts: { ...pricing.minAmounts },
      maxAmounts: { ...pricing.maxAmounts },
      delayOptionsHours: [...pricing.delayOptionsHours],
      disclaimer: pricing.disclaimer,
      version: pricing.version,
    },
    retrievedAt: result.retrievedAt,
  };
}
