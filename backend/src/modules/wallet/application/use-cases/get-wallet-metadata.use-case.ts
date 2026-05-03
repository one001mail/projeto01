/**
 * GetWalletMetadataUseCase.
 *
 * Returns public wallet + address metadata only. The handler fails loudly
 * if a caller ever tries to retrieve secret material through this path
 * — see `private-key-safety.policy.ts`.
 */
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import type { WalletAddressRepository } from '../../domain/repositories/wallet-address.repository.js';
import type { WalletRepository } from '../../domain/repositories/wallet.repository.js';
import type { WalletMetadataDto } from '../dto/wallet-metadata.dto.js';
import { toWalletMetadataDto } from '../mappers/wallet.mapper.js';

export type GetWalletMetadataError = { kind: 'WALLET_NOT_FOUND'; message: string };

export interface GetWalletMetadataDeps {
  readonly walletRepo: WalletRepository;
  readonly addressRepo: WalletAddressRepository;
}

export class GetWalletMetadataUseCase {
  constructor(private readonly deps: GetWalletMetadataDeps) {}

  async execute(walletId: string): Promise<Ok<WalletMetadataDto> | Err<GetWalletMetadataError>> {
    const wallet = await this.deps.walletRepo.findById(walletId);
    if (!wallet) {
      return err({ kind: 'WALLET_NOT_FOUND', message: `Wallet '${walletId}' not found` });
    }
    const addresses = await this.deps.addressRepo.listByWallet(walletId, 500);
    return ok(toWalletMetadataDto(wallet, addresses));
  }
}
