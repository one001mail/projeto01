/**
 * SyncWalletBalancesUseCase.
 *
 * Refreshes the blockchain balance for every active address of a wallet
 * by querying the blockchain provider. Returns the aggregated snapshot.
 */
import type { Clock } from '../../../../shared/application/ports/clock.port.js';
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import type { WalletAddressRepository } from '../../domain/repositories/wallet-address.repository.js';
import type { WalletRepository } from '../../domain/repositories/wallet.repository.js';
import type { NetworkKind } from '../../domain/value-objects/network.js';
import type { AuditSinkPort } from './create-wallet.use-case.js';
import type { BalanceReaderPort } from './get-address-balance.use-case.js';

export interface SyncedBalanceEntry {
  readonly address: string;
  readonly network: NetworkKind;
  readonly asset: string;
  readonly confirmed: string;
  readonly pending: string;
  readonly observedAt: string;
  readonly error?: string;
}

export interface SyncResultDto {
  readonly walletId: string;
  readonly balances: readonly SyncedBalanceEntry[];
  readonly syncedAt: string;
}

export type SyncWalletBalancesError = { kind: 'WALLET_NOT_FOUND'; message: string };

export interface SyncWalletBalancesDeps {
  readonly walletRepo: WalletRepository;
  readonly addressRepo: WalletAddressRepository;
  readonly reader: BalanceReaderPort;
  readonly clock: Clock;
  readonly audit: AuditSinkPort;
}

export class SyncWalletBalancesUseCase {
  constructor(private readonly deps: SyncWalletBalancesDeps) {}

  async execute(walletId: string): Promise<Ok<SyncResultDto> | Err<SyncWalletBalancesError>> {
    const wallet = await this.deps.walletRepo.findById(walletId);
    if (!wallet) {
      return err({ kind: 'WALLET_NOT_FOUND', message: `Wallet '${walletId}' not found` });
    }
    const addresses = await this.deps.addressRepo.listByWallet(walletId, 500);
    const observedAt = this.deps.clock.now().toISOString();
    const entries: SyncedBalanceEntry[] = [];
    for (const a of addresses) {
      if (a.status !== 'active') continue;
      try {
        const balance = await this.deps.reader.getBalance({
          network: a.network.kind as NetworkKind,
          address: a.address.value,
          asset: a.asset.value,
        });
        entries.push({
          address: a.address.value,
          network: a.network.kind as NetworkKind,
          asset: a.asset.value,
          confirmed: balance.confirmed,
          pending: balance.pending,
          observedAt,
        });
      } catch (e) {
        entries.push({
          address: a.address.value,
          network: a.network.kind as NetworkKind,
          asset: a.asset.value,
          confirmed: '0',
          pending: '0',
          observedAt,
          error: e instanceof Error ? e.message : 'provider error',
        });
      }
    }
    await this.deps.audit.record({
      operation: 'wallet.balance-synced',
      actor: wallet.ownerRef,
      subject: wallet.id,
      metadata: { addressCount: entries.length },
    });
    return ok({
      walletId,
      balances: entries,
      syncedAt: observedAt,
    });
  }
}
