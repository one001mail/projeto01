import type { WalletAddress } from '../entities/wallet-address.entity.js';

export interface WalletAddressRepository {
  save(address: WalletAddress): Promise<void>;
  findById(id: string): Promise<WalletAddress | null>;
  findByAddress(walletId: string, address: string): Promise<WalletAddress | null>;
  listByWallet(walletId: string, limit: number): Promise<readonly WalletAddress[]>;
  nextIndex(walletId: string, network: string): Promise<number>;
}
