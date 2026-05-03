import type { Currency, PricingTier, CurrencyRange } from "../types";

/** Single source of truth for all pricing tiers */
export const PRICING_TIERS: Record<Currency, PricingTier[]> = {
  BTC: [
    { min: 0.001, max: 0.1, rate: 0.03, minFee: 0.00003 },
    { min: 0.1, max: 1, rate: 0.025, minFee: 0.0025 },
    { min: 1, max: 10, rate: 0.02, minFee: 0.02 },
    { min: 10, max: 100, rate: 0.015, minFee: 0.15 },
  ],
  ETH: [
    { min: 0.01, max: 1, rate: 0.03, minFee: 0.0003 },
    { min: 1, max: 10, rate: 0.025, minFee: 0.025 },
    { min: 10, max: 100, rate: 0.02, minFee: 0.2 },
    { min: 100, max: 1000, rate: 0.015, minFee: 1.5 },
  ],
  LTC: [
    { min: 0.1, max: 10, rate: 0.03, minFee: 0.003 },
    { min: 10, max: 100, rate: 0.025, minFee: 0.25 },
    { min: 100, max: 1000, rate: 0.02, minFee: 2 },
    { min: 1000, max: 10000, rate: 0.015, minFee: 15 },
  ],
  USDT: [
    { min: 10, max: 1000, rate: 0.03, minFee: 0.3 },
    { min: 1000, max: 10000, rate: 0.025, minFee: 25 },
    { min: 10000, max: 100000, rate: 0.02, minFee: 200 },
    { min: 100000, max: 1000000, rate: 0.015, minFee: 1500 },
  ],
  USDC: [
    { min: 10, max: 1000, rate: 0.03, minFee: 0.3 },
    { min: 1000, max: 10000, rate: 0.025, minFee: 25 },
    { min: 10000, max: 100000, rate: 0.02, minFee: 200 },
    { min: 100000, max: 1000000, rate: 0.015, minFee: 1500 },
  ],
};

/** Slider/input ranges per currency */
export const CURRENCY_RANGES: Record<Currency, CurrencyRange> = {
  BTC: { min: 0.001, max: 50, step: 0.001 },
  ETH: { min: 0.01, max: 500, step: 0.01 },
  LTC: { min: 0.1, max: 5000, step: 0.1 },
  USDT: { min: 10, max: 500000, step: 1 },
  USDC: { min: 10, max: 500000, step: 1 },
};

/** Human-readable fee table rows for the Fees page */
export function getFeeTableRows(): { range: string; fee: string; min: string }[] {
  return [
    { range: "0.001 – 0.1 BTC", fee: "3.0%", min: "0.00003 BTC" },
    { range: "0.1 – 1.0 BTC", fee: "2.5%", min: "0.0025 BTC" },
    { range: "1.0 – 10 BTC", fee: "2.0%", min: "0.02 BTC" },
    { range: "10+ BTC", fee: "1.5%", min: "0.15 BTC" },
    { range: "10 – 1,000 USDT/USDC", fee: "3.0%", min: "$0.30" },
    { range: "1,000 – 10,000 USDT/USDC", fee: "2.5%", min: "$25" },
    { range: "10,000 – 100,000 USDT/USDC", fee: "2.0%", min: "$200" },
    { range: "100,000+ USDT/USDC", fee: "1.5%", min: "$1,500" },
  ];
}
