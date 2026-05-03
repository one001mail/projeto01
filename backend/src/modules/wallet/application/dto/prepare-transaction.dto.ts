import type { FeeData } from '../../domain/entities/blockchain-transaction.entity.js';
/**
 * Input / output shapes for PrepareTransactionUseCase.
 */
import type { NetworkKind } from '../../domain/value-objects/network.js';

export interface PrepareTransactionDto {
  readonly walletId: string;
  readonly network: NetworkKind;
  readonly fromAddress: string;
  readonly toAddress: string;
  readonly asset: string;
  /** Amount in minor units as decimal string (wei / satoshi / etc). */
  readonly amount: string;
  readonly maxAmountPerTx?: string | null;
}

export interface PreparedTransactionDto {
  readonly transactionId: string;
  readonly walletId: string;
  readonly network: NetworkKind;
  readonly fromAddress: string;
  readonly toAddress: string;
  readonly asset: string;
  readonly amount: string;
  readonly fee: FeeData;
  readonly unsignedPayload: string;
  readonly status: 'prepared';
  readonly createdAt: string;
}
