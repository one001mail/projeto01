import type { BlockchainTransaction } from '../../domain/entities/blockchain-transaction.entity.js';
import type { NetworkKind } from '../../domain/value-objects/network.js';
import type { BroadcastedTransactionDto } from '../dto/broadcast-transaction.dto.js';
import type { PreparedTransactionDto } from '../dto/prepare-transaction.dto.js';

export function toPreparedTransactionDto(tx: BlockchainTransaction): PreparedTransactionDto {
  if (tx.status !== 'prepared') {
    throw new Error(`Transaction '${tx.id}' is not in 'prepared' status`);
  }
  if (tx.unsignedPayload == null) {
    throw new Error(`Transaction '${tx.id}' has no unsigned payload`);
  }
  return {
    transactionId: tx.id,
    walletId: tx.walletId,
    network: tx.network.kind as NetworkKind,
    fromAddress: tx.fromAddress.value,
    toAddress: tx.toAddress.value,
    asset: tx.asset.value,
    amount: tx.amount,
    fee: tx.fee,
    unsignedPayload: tx.unsignedPayload,
    status: 'prepared',
    createdAt: tx.createdAt.toISOString(),
  };
}

export function toBroadcastedTransactionDto(tx: BlockchainTransaction): BroadcastedTransactionDto {
  if (!tx.txHash) {
    throw new Error(`Transaction '${tx.id}' has no broadcasted hash`);
  }
  return {
    transactionId: tx.id,
    walletId: tx.walletId,
    network: tx.network.kind as NetworkKind,
    txHash: tx.txHash.value,
    status: 'broadcasted',
    updatedAt: tx.updatedAt.toISOString(),
  };
}
