import type { WalletAddress } from '../../domain/entities/wallet-address.entity.js';
import type { WalletAddressRepository } from '../../domain/repositories/wallet-address.repository.js';

export class InMemoryWalletAddressRepository implements WalletAddressRepository {
  private readonly store = new Map<string, WalletAddress>();

  async save(address: WalletAddress): Promise<void> {
    this.store.set(address.id, address);
  }

  async findById(id: string): Promise<WalletAddress | null> {
    return this.store.get(id) ?? null;
  }

  async findByAddress(walletId: string, address: string): Promise<WalletAddress | null> {
    for (const a of this.store.values()) {
      if (a.walletId === walletId && a.address.value === address) return a;
    }
    return null;
  }

  async listByWallet(walletId: string, limit: number): Promise<readonly WalletAddress[]> {
    return [...this.store.values()]
      .filter((a) => a.walletId === walletId)
      .sort((a, b) => a.addressIndex - b.addressIndex)
      .slice(0, Math.max(0, limit));
  }

  async nextIndex(walletId: string, network: string): Promise<number> {
    let max = -1;
    for (const a of this.store.values()) {
      if (a.walletId === walletId && a.network.kind === network) {
        if (a.addressIndex > max) max = a.addressIndex;
      }
    }
    return max + 1;
  }

  reset(): void {
    this.store.clear();
  }
}
