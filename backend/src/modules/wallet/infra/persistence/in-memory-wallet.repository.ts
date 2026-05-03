import type { Wallet } from '../../domain/entities/wallet.entity.js';
import type { WalletRepository } from '../../domain/repositories/wallet.repository.js';

export class InMemoryWalletRepository implements WalletRepository {
  private readonly store = new Map<string, Wallet>();

  async save(wallet: Wallet): Promise<void> {
    this.store.set(wallet.id, wallet);
  }

  async findById(walletId: string): Promise<Wallet | null> {
    return this.store.get(walletId) ?? null;
  }

  async listByOwner(ownerRef: string, limit: number): Promise<readonly Wallet[]> {
    return [...this.store.values()]
      .filter((w) => w.ownerRef === ownerRef)
      .slice(0, Math.max(0, limit));
  }

  reset(): void {
    this.store.clear();
  }
}
