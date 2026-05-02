/**
 * Pricing domain.
 *
 * Stateless, read-only source of truth for the public pricing page. Kept in
 * the domain layer so it can evolve independently of the HTTP surface and
 * so consumers (e.g. a scheduled exporter) could reuse the same shape.
 *
 * Values are sandbox / educational — not a financial offer.
 */
export type Currency = 'BTC' | 'ETH' | 'USDT';

export interface PricingSnapshot {
  readonly currencies: readonly Currency[];
  readonly feeBps: number;
  readonly minAmounts: Readonly<Record<Currency, number>>;
  readonly maxAmounts: Readonly<Record<Currency, number>>;
  readonly delayOptionsHours: readonly number[];
  readonly disclaimer: string;
  readonly version: string;
}

export const CURRENT_PRICING: PricingSnapshot = {
  currencies: ['BTC', 'ETH', 'USDT'],
  feeBps: 100, // 1.00%
  minAmounts: { BTC: 0.001, ETH: 0.01, USDT: 10 },
  maxAmounts: { BTC: 5, ETH: 100, USDT: 250_000 },
  delayOptionsHours: [6, 12, 24, 48],
  disclaimer: 'Educational sandbox pricing; not a financial offer. Values are illustrative.',
  version: '2025-07-01',
};
