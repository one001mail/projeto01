/**
 * Pricing HTTP schemas (Zod).
 */
import { z } from 'zod';

export const CurrencySchema = z.enum(['BTC', 'ETH', 'USDT']);
export type Currency = z.infer<typeof CurrencySchema>;

export const PricingDtoSchema = z.object({
  currencies: z.array(CurrencySchema),
  feeBps: z.number().int().nonnegative(),
  minAmounts: z.record(CurrencySchema, z.number().nonnegative()),
  maxAmounts: z.record(CurrencySchema, z.number().positive()),
  delayOptionsHours: z.array(z.number().int().positive()),
  disclaimer: z.string(),
  version: z.string(),
});
export type PricingDto = z.infer<typeof PricingDtoSchema>;

export const PricingEnvelopeSchema = z.object({
  pricing: PricingDtoSchema,
  retrievedAt: z.string(),
});
export type PricingEnvelope = z.infer<typeof PricingEnvelopeSchema>;
