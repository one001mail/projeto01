/**
 * GetAddressBalanceUseCase.
 *
 * Queries the configured blockchain provider for confirmed + pending
 * balance at a given address. Wallet ownership is enforced: only
 * addresses that belong to the referenced wallet may be queried through
 * this module.
 */
import type { Clock } from '../../../../shared/application/ports/clock.port.js';
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import type { WalletAddressRepository } from '../../domain/repositories/wallet-address.repository.js';
import type { WalletRepository } from '../../domain/repositories/wallet.repository.js';
import type { NetworkKind } from '../../domain/value-objects/network.js';
import type { BalanceResultDto, GetBalanceDto } from '../dto/get-balance.dto.js';

/** Minimal balance-reader port (structural). */
export interface BalanceReaderPort {
  getBalance(input: {
    network: NetworkKind;
    address: string;
    asset: string;
  }): Promise<{ confirmed: string; pending: string }>;
}

export type GetAddressBalanceError =
  | { kind: 'WALLET_NOT_FOUND'; message: string }
  | { kind: 'ADDRESS_NOT_FOUND'; message: string }
  | { kind: 'PROVIDER_ERROR'; message: string };

export interface GetAddressBalanceDeps {
  readonly walletRepo: WalletRepository;
  readonly addressRepo: WalletAddressRepository;
  readonly reader: BalanceReaderPort;
  readonly clock: Clock;
}

export class GetAddressBalanceUseCase {
  constructor(private readonly deps: GetAddressBalanceDeps) {}

  async execute(input: GetBalanceDto): Promise<Ok<BalanceResultDto> | Err<GetAddressBalanceError>> {
    const wallet = await this.deps.walletRepo.findById(input.walletId);
    if (!wallet) {
      return err({ kind: 'WALLET_NOT_FOUND', message: `Wallet '${input.walletId}' not found` });
    }
    const addr = await this.deps.addressRepo.findByAddress(input.walletId, input.address);
    if (!addr) {
      return err({
        kind: 'ADDRESS_NOT_FOUND',
        message: `Address '${input.address}' not found under wallet '${input.walletId}'`,
      });
    }
    try {
      const res = await this.deps.reader.getBalance({
        network: addr.network.kind as NetworkKind,
        address: addr.address.value,
        asset: addr.asset.value,
      });
      return ok({
        walletId: wallet.id,
        address: addr.address.value,
        network: addr.network.kind as NetworkKind,
        asset: addr.asset.value,
        confirmed: res.confirmed,
        pending: res.pending,
        observedAt: this.deps.clock.now().toISOString(),
      });
    } catch (e) {
      return err({
        kind: 'PROVIDER_ERROR',
        message: e instanceof Error ? e.message : 'provider error',
      });
    }
  }
}
