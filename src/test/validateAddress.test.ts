import { describe, it, expect } from "vitest";
import {
  validateAddress,
  NETWORK_ASSETS,
  NETWORK_LABELS,
  ASSET_LABELS,
} from "@/domain/session/validateAddress";

describe("validateAddress", () => {
  it("rejects an empty address", () => {
    expect(validateAddress("sepolia", "   ")).toBe("Address is required");
  });

  it("accepts a valid sepolia address", () => {
    expect(
      validateAddress("sepolia", "0x" + "a".repeat(40)),
    ).toBeNull();
  });

  it("rejects a malformed sepolia address", () => {
    expect(validateAddress("sepolia", "0x123")).toMatch(/Invalid Ethereum/);
  });

  it("accepts a tb1 btc testnet address", () => {
    expect(
      validateAddress("btc_testnet", "tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3"),
    ).toBeNull();
  });

  it("rejects a malformed btc testnet address", () => {
    expect(validateAddress("btc_testnet", "1ABC")).toMatch(/Invalid BTC/);
  });

  it("returns null for unknown networks (no validation rule)", () => {
    expect(validateAddress("unknown", "anything")).toBeNull();
  });

  it("exposes the network/asset metadata maps", () => {
    expect(NETWORK_ASSETS.sepolia).toContain("ETH");
    expect(NETWORK_ASSETS.btc_testnet).toContain("BTC");
    expect(NETWORK_LABELS.sepolia).toBeTruthy();
    expect(ASSET_LABELS.ETH).toBeTruthy();
  });
});
