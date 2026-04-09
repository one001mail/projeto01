import { describe, it, expect } from "vitest";
import { validateMixRequest } from "@/domain/mixing/validateMixRequest";

describe("validateMixRequest", () => {
  it("returns error for zero amount", () => {
    const errors = validateMixRequest({ amount: 0, currency: "BTC", outputs: [{ address: "abc", percentage: 100 }], delayHours: 6 });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("amount");
  });

  it("returns error for empty address", () => {
    const errors = validateMixRequest({ amount: 1, currency: "BTC", outputs: [{ address: "", percentage: 100 }], delayHours: 6 });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toContain("address");
  });

  it("returns error for wrong percentage total", () => {
    const errors = validateMixRequest({
      amount: 1, currency: "BTC",
      outputs: [{ address: "a", percentage: 50 }, { address: "b", percentage: 40 }],
      delayHours: 6,
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("outputs.percentage");
  });

  it("passes for valid request", () => {
    const errors = validateMixRequest({
      amount: 1, currency: "BTC",
      outputs: [{ address: "a", percentage: 60 }, { address: "b", percentage: 40 }],
      delayHours: 6,
    });
    expect(errors).toHaveLength(0);
  });
});
