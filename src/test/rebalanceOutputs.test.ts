import { describe, it, expect } from "vitest";
import { addOutput, removeOutput, updateOutputPercentage } from "@/domain/mixing/rebalanceOutputs";

describe("rebalanceOutputs", () => {
  it("addOutput adds entry with remaining percentage", () => {
    const result = addOutput([{ address: "a", percentage: 70 }]);
    expect(result).toHaveLength(2);
    expect(result[1].percentage).toBe(30);
  });

  it("addOutput caps at 5", () => {
    const five = Array.from({ length: 5 }, () => ({ address: "a", percentage: 20 }));
    expect(addOutput(five)).toHaveLength(5);
  });

  it("removeOutput redistributes to first", () => {
    const result = removeOutput([{ address: "a", percentage: 60 }, { address: "b", percentage: 40 }], 1);
    expect(result).toHaveLength(1);
    expect(result[0].percentage).toBe(100);
  });

  it("updateOutputPercentage adjusts others proportionally", () => {
    const result = updateOutputPercentage(
      [{ address: "a", percentage: 50 }, { address: "b", percentage: 50 }],
      0, 70
    );
    expect(result[0].percentage).toBe(70);
    expect(result[1].percentage).toBe(30);
    expect(result.reduce((s, o) => s + o.percentage, 0)).toBe(100);
  });
});
