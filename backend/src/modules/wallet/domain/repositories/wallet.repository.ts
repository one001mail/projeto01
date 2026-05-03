/**
 * Wallet repository port.
 *
 * Defines the persistence contract for the Wallet aggregate. Application
 * layer depends ONLY on this interface. Concrete adapters (in-memory,
 * Postgres, ...) live under `infra/persistence/`.
 */
import type { Wallet } from '../entities/wallet.entity.js';

export interface WalletRepository {
  save(wallet: Wallet): Promise<void>;
  findById(walletId: string): Promise<Wallet | null>;
  listByOwner(ownerRef: string, limit: number): Promise<readonly Wallet[]>;
}
