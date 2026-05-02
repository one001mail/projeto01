/**
 * Pricing HTTP schemas (Zod).
 *
 * `/api/pricing/quote` is a calculator endpoint. It does NOT touch the
 * pricing snapshot store — it computes a quote in-memory from the current
 * `PricingSnapshot` and the user-provided amount/currency. The response
 * always carries a sandbox notice.
 */
import { z } from 'zod';
import { IsoTimestampSchema, SandboxNoticeSchema } from './common.schemas.js';

export const PricingCurrencySchema = z.enum(['BTC', 'ETH', 'USDT']);
export type PricingCurrency = z.infer<typeof PricingCurrencySchema>;

export const PricingQuoteQuerySchema = z
  .object({
    currency: PricingCurrencySchema,
    amount: z.coerce.number().finite().positive('amount must be positive'),
    delayHours: z.coerce
      .number()
      .finite()
      .nonnegative()
      .max(24 * 14)
      .optional(),
  })
  .strict();
export type PricingQuoteQuery = z.infer<typeof PricingQuoteQuerySchema>;

export const PricingQuoteDtoSchema = z.object({
  currency: PricingCurrencySchema,
  gross: z.number(),
  feeBps: z.number().int().nonnegative(),
  fee: z.number(),
  net: z.number(),
  minAmount: z.number(),
  maxAmount: z.number(),
  delayHours: z.number().nonnegative(),
  expectedDeliveryAt: IsoTimestampSchema,
  pricingVersion: z.string(),
  computedAt: IsoTimestampSchema,
  sandboxNotice: SandboxNoticeSchema,
});
export type PricingQuoteDto = z.infer<typeof PricingQuoteDtoSchema>;
