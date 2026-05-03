import { WalletAddress } from '../entities/wallet-address.entity.js';
/**
 * Pure service coordinating address generation at the domain level.
 *
 * It does NOT perform cryptographic derivation (that's an infrastructure
 * concern delegated to `PublicAddressDerivationProvider`), but it does
 * decide which derivation path to request for a given network + index,
 * enforces the ownership/safety policies, and assembles a valid
 * `WalletAddress` entity from the derived public address.
 */
import type { Wallet } from '../entities/wallet.entity.js';
import { enforcePrivateKeySafety } from '../policies/private-key-safety.policy.js';
import { DerivationPath } from '../value-objects/derivation-path.js';
import type { Network, NetworkKind } from '../value-objects/network.js';

/**
 * Default BIP-44/84 derivation path for a given network + index.
 * Ethereum: m/44'/60'/0'/0/i  (account 0, external chain)
 * Bitcoin:  m/84'/0'/0'/0/i   (Native SegWit, account 0)
 */
function defaultDerivationPath(network: NetworkKind, addressIndex: number): DerivationPath {
  switch (network) {
    case 'ethereum-sepolia':
    case 'ethereum-mainnet':
      return DerivationPath.of(`m/44'/60'/0'/0/${addressIndex}`);
    case 'bitcoin-testnet':
      return DerivationPath.of(`m/84'/1'/0'/0/${addressIndex}`);
    case 'bitcoin-mainnet':
      return DerivationPath.of(`m/84'/0'/0'/0/${addressIndex}`);
  }
}

export interface AssembleAddressInput {
  readonly id: string;
  readonly wallet: Wallet;
  readonly network: Network;
  readonly addressIndex: number;
  readonly publicAddress: string;
  readonly asset: string;
  readonly chainId?: number | null;
  readonly now?: Date;
}

export class AddressDerivationService {
  assembleAddress(input: AssembleAddressInput): WalletAddress {
    enforcePrivateKeySafety({ publicAddress: input.publicAddress });
    if (!input.wallet.supports(input.network)) {
      throw new Error(`Wallet does not support network '${input.network.kind}'`);
    }
    const path = defaultDerivationPath(input.network.kind, input.addressIndex);
    return WalletAddress.create({
      id: input.id,
      walletId: input.wallet.id,
      network: input.network.kind,
      chainId: input.chainId ?? null,
      asset: input.asset,
      address: input.publicAddress,
      derivationPath: path.value,
      addressIndex: input.addressIndex,
      ...(input.now ? { now: input.now } : {}),
    });
  }

  pathFor(network: NetworkKind, addressIndex: number): DerivationPath {
    return defaultDerivationPath(network, addressIndex);
  }
}
