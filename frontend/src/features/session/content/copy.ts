export const SESSION_COPY = {
  title: "New Wallet Session",
  subtitle: "Initialize a testnet wallet session",
  testnetWarning: "Testnet Only — No Real Funds",
  networkLabel: "Network",
  networkPlaceholder: "Select network",
  assetLabel: "Asset",
  assetPlaceholder: (hasNetwork: boolean) => (hasNetwork ? "Select asset" : "Select network first"),
  addressLabel: "Output Address",
  submitIdle: "Create Session",
  submitSubmitting: "Creating Session...",
  successTitle: "Session Created",
  resetCta: "Create Another Session",
} as const;
