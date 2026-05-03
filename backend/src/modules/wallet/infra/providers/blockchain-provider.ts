/**
 * BlockchainProvider port.
 *
 * Abstract interface over a blockchain network (Ethereum-compatible,
 * Bitcoin-compatible, ...). All on-chain I/O for the wallet module flows
 * through this port so the implementation can be swapped between RPC
 * vendors (Infura, Alchemy, self-hosted, etc.) without touching the
 * application layer.
 */
import type { FeeData } from '../../domain/entities/blockchain-transaction.entity.js';

export interface GetBalanceInput {
  readonly address: string;
  readonly asset: string;
}

export interface GetBalanceResult {
  readonly confirmed: string;
  readonly pending: string;
}

export interface BuildUnsignedInput {
  readonly from: string;
  readonly to: string;
  readonly asset: string;
  readonly amount: string; // minor units
}

export interface BuildUnsignedResult {
  readonly unsignedPayload: string; // hex
  readonly fee: FeeData;
}

export interface BroadcastResult {
  readonly txHash: string;
}

export interface BlockchainProvider {
  readonly family: 'ethereum' | 'bitcoin';
  readonly networkName: string;
  isConfigured(): boolean;
  getBalance(input: GetBalanceInput): Promise<GetBalanceResult>;
  buildUnsigned(input: BuildUnsignedInput): Promise<BuildUnsignedResult>;
  broadcast(signedRawTx: string): Promise<BroadcastResult>;
}

/** Common error surfaced from provider calls. */
export class BlockchainProviderError extends Error {
  constructor(
    message: string,
    public readonly networkName: string,
    public readonly rpcStatus?: number,
  ) {
    super(message);
    this.name = 'BlockchainProviderError';
  }
}
