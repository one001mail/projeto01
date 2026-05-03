/**
 * Domain service that validates a pending transaction against business
 * policies (limits, ownership, safety). Returns `ok`/`err` without
 * mutating the aggregate.
 */
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import type { WalletAddress } from '../entities/wallet-address.entity.js';
import type { Wallet } from '../entities/wallet.entity.js';
import { ensureAddressOwnership } from '../policies/address-ownership.policy.js';
import { ensureWithinLimit } from '../policies/transaction-limit.policy.js';
import type { NetworkKind } from '../value-objects/network.js';

export interface ValidateTransactionInput {
  readonly wallet: Wallet;
  readonly fromAddress: WalletAddress;
  readonly network: NetworkKind;
  readonly asset: string;
  readonly amount: string;
  readonly maxAmountPerTx: string;
}

export type TransactionPolicyError =
  | { kind: 'OWNERSHIP'; message: string }
  | { kind: 'LIMIT'; message: string }
  | { kind: 'WALLET_ARCHIVED'; message: string };

export class TransactionPolicyService {
  validate(input: ValidateTransactionInput): Ok<true> | Err<TransactionPolicyError> {
    if (input.wallet.status !== 'active') {
      return err({ kind: 'WALLET_ARCHIVED', message: 'Wallet is archived' });
    }
    const ownership = ensureAddressOwnership(input.wallet, input.fromAddress, input.network);
    if (!ownership.ok) {
      return err({ kind: 'OWNERSHIP', message: ownership.error.message });
    }
    const limit = ensureWithinLimit(input.amount, input.maxAmountPerTx);
    if (!limit.ok) {
      return err({ kind: 'LIMIT', message: limit.error.message });
    }
    return ok(true);
  }
}
