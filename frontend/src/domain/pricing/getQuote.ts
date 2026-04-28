import type { Currency, MixQuote } from "../types";
import { PRICING_TIERS } from "./pricingRules";

/** Calculate a fee quote for a given currency and amount. Pure function. */
export function getQuote(currency: Currency, amount: number): MixQuote {
  const tiers = PRICING_TIERS[currency];
  const tier = tiers.find((t) => amount >= t.min && amount < t.max) ?? tiers[tiers.length - 1];
  const calculatedFee = amount * tier.rate;
  const fee = Math.max(calculatedFee, tier.minFee);
  const net = Math.max(amount - fee, 0);
  return {
    rate: tier.rate,
    ratePercent: (tier.rate * 100).toFixed(1),
    fee,
    net,
    minFee: tier.minFee,
  };
}

/** Format a numeric value for display */
export function formatCryptoAmount(n: number): string {
  if (n < 0.0001) return n.toExponential(2);
  if (n < 1) return n.toFixed(6);
  if (n < 100) return n.toFixed(4);
  return n.toFixed(2);
}
