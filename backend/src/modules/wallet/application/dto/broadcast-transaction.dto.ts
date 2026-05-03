import type { NetworkKind } from '../../domain/value-objects/network.js';

export interface BroadcastTransactionDto {
  readonly walletId: string;
  readonly transactionId: string;
  /** Hex-encoded signed raw transaction (0x-prefixed for Ethereum). */
  readonly signedRawTx: string;
}

export interface BroadcastedTransactionDto {
  readonly transactionId: string;
  readonly walletId: string;
  readonly network: NetworkKind;
  readonly txHash: string;
  readonly status: 'broadcasted';
  readonly updatedAt: string;
}
