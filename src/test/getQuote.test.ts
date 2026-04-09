import { describe, it, expect } from "vitest";
import { getQuote, formatCryptoAmount } from "@/domain/pricing/getQuote";

describe("getQuote", () => {
  it("returns correct tier for small BTC amount", () => {
    const q = getQuote("BTC", 0.05);
    expect(q.rate).toBe(0.03);
    expect(q.fee).toBeCloseTo(0.05 * 0.03);
    expect(q.net).toBeCloseTo(0.05 - q.fee);
  });

  it("applies minFee when calculated fee is lower", () => {
    const q = getQuote("BTC", 0.001);
    expect(q.fee).toBe(0.00003); // minFee
  });

  it("works for USDT", () => {
    const q = getQuote("USDT", 5000);
    expect(q.rate).toBe(0.025);
    expect(q.fee).toBeCloseTo(125);
  });

  it("falls back to last tier for large amounts", () => {
    const q = getQuote("BTC", 999);
    expect(q.rate).toBe(0.015);
  });
});

describe("formatCryptoAmount", () => {
  it("formats small numbers with 6 decimals", () => {
    expect(formatCryptoAmount(0.000123)).toBe("0.000123");
  });
  it("formats large numbers with 2 decimals", () => {
    expect(formatCryptoAmount(1234.5)).toBe("1234.50");
  });
});
