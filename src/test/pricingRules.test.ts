import { describe, it, expect } from "vitest";
import {
  getFeeTableRows,
  PRICING_TIERS,
  CURRENCY_RANGES,
} from "@/domain/pricing/pricingRules";

describe("pricingRules", () => {
  it("returns a non-empty fee table", () => {
    const rows = getFeeTableRows();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.range).toBeTruthy();
      expect(row.fee).toMatch(/%/);
      expect(row.min).toBeTruthy();
    }
  });

  it("defines tiers for every supported currency", () => {
    for (const currency of ["BTC", "ETH", "LTC", "USDT", "USDC"] as const) {
      expect(PRICING_TIERS[currency].length).toBeGreaterThan(0);
      expect(CURRENCY_RANGES[currency]).toBeDefined();
    }
  });
});
