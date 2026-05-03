/**
 * Address ownership policy.
 *
 * Ensures a given WalletAddress actually belongs to the wallet and is
 * bound to the intended network before that address is used as a
 * transaction source.
 */
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import type { WalletAddress } from '../entities/wallet-address.entity.js';
import type { Wallet } from '../entities/wallet.entity.js';
import type { NetworkKind } from '../value-objects/network.js';

export function ensureAddressOwnership(
  wallet: Wallet,
  address: WalletAddress,
  network: NetworkKind,
): Ok<true> | Err<{ message: string }> {
  if (address.walletId !== wallet.id) {
    return err({ message: 'Source address does not belong to the given wallet' });
  }
  if (address.network.kind !== network) {
    return err({ message: 'Source address network mismatch' });
  }
  if (address.status !== 'active') {
    return err({ message: 'Source address is not active' });
  }
  return ok(true);
}
