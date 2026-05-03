import type { BlockchainTransaction } from '../entities/blockchain-transaction.entity.js';

export interface BlockchainTransactionRepository {
  save(tx: BlockchainTransaction): Promise<void>;
  findById(id: string): Promise<BlockchainTransaction | null>;
  listByWallet(walletId: string, limit: number): Promise<readonly BlockchainTransaction[]>;
}
