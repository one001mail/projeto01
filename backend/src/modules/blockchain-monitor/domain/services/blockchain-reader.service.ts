/**
 * Blockchain-reader service — SANDBOX.
 *
 * Domain-level abstraction consumed by use cases. Only ever resolved
 * against a MOCK provider (`infra/providers/mock-blockchain-reader.provider.ts`).
 */
export interface BlockchainObservation {
  readonly txid: string; // mocktx_*
  readonly blockHeight: number;
}

export interface BlockchainReaderService {
  /** Returns pending MOCK observations. Never hits a real chain. */
  pollPending(): Promise<readonly BlockchainObservation[]>;
}
