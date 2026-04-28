/** Supported currencies across the application */
export type Currency = "BTC" | "ETH" | "LTC" | "USDT" | "USDC";

export const CURRENCIES: Currency[] = ["BTC", "ETH", "LTC", "USDT", "USDC"];

export const CURRENCY_LABELS: Record<Currency, string> = {
  BTC: "BTC — Bitcoin",
  ETH: "ETH — Ethereum",
  LTC: "LTC — Litecoin",
  USDT: "USDT — Tether",
  USDC: "USDC — USD Coin",
};

/** Mix session statuses */
export type MixStatus = "idle" | "submitting" | "processing" | "complete";

/** A single output destination */
export interface MixOutput {
  address: string;
  percentage: number;
}

/** Full mix request before submission */
export interface MixRequest {
  amount: number;
  currency: Currency;
  outputs: MixOutput[];
  delayHours: number;
}

/** Quote result from fee calculation */
export interface MixQuote {
  rate: number;
  ratePercent: string;
  fee: number;
  net: number;
  minFee: number;
}

/** A pricing tier definition */
export interface PricingTier {
  min: number;
  max: number;
  rate: number;
  minFee: number;
}

/** Slider range per currency */
export interface CurrencyRange {
  min: number;
  max: number;
  step: number;
}
