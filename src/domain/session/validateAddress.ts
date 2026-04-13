const ETH_RE = /^0x[0-9a-fA-F]{40}$/;
const BTC_TESTNET_RE = /^(m|n|2|tb1)[a-zA-HJ-NP-Z0-9]{25,62}$/;

export function validateAddress(network: string, address: string): string | null {
  if (!address.trim()) return "Address is required";

  if (network === "sepolia") {
    if (!ETH_RE.test(address.trim())) {
      return "Invalid Ethereum address. Must be 0x followed by 40 hex characters.";
    }
  } else if (network === "btc_testnet") {
    if (!BTC_TESTNET_RE.test(address.trim())) {
      return "Invalid BTC testnet address. Must start with m, n, 2, or tb1.";
    }
  }

  return null;
}

export const NETWORK_ASSETS: Record<string, string[]> = {
  sepolia: ["ETH"],
  btc_testnet: ["BTC"],
};

export const NETWORK_LABELS: Record<string, string> = {
  sepolia: "Sepolia (Ethereum Testnet)",
  btc_testnet: "Bitcoin Testnet",
};

export const ASSET_LABELS: Record<string, string> = {
  ETH: "ETH — Ethereum",
  BTC: "BTC — Bitcoin",
};
