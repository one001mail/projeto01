import type { BlockchainTransaction } from '../../domain/entities/blockchain-transaction.entity.js';
import type { BlockchainTransactionRepository } from '../../domain/repositories/blockchain-transaction.repository.js';

export class InMemoryBlockchainTransactionRepository implements BlockchainTransactionRepository {
  private readonly store = new Map<string, BlockchainTransaction>();

  async save(tx: BlockchainTransaction): Promise<void> {
    this.store.set(tx.id, tx);
  }

  async findById(id: string): Promise<BlockchainTransaction | null> {
    return this.store.get(id) ?? null;
  }

  async listByWallet(walletId: string, limit: number): Promise<readonly BlockchainTransaction[]> {
    return [...this.store.values()]
      .filter((t) => t.walletId === walletId)
      .slice(0, Math.max(0, limit));
  }

  reset(): void {
    this.store.clear();
  }
}
