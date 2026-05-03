/**
 * Pure domain service encapsulating wallet-lifecycle logic that spans
 * more than a single entity method. Keeps `Wallet` focused on its own
 * invariants.
 */
import { Wallet, type WalletCreateInput } from '../entities/wallet.entity.js';
import type { WalletMode } from '../entities/wallet.entity.js';
import type { MainnetGatePolicy } from '../policies/mainnet-gate.policy.js';
import { enforcePrivateKeySafety } from '../policies/private-key-safety.policy.js';
import type { NetworkKind } from '../value-objects/network.js';

export interface CreateWalletContext {
  readonly mainnetEnabled: boolean;
  readonly defaultMode: WalletMode;
}

export class WalletDomainService {
  constructor(private readonly gate: MainnetGatePolicy) {}

  createWallet(input: WalletCreateInput, ctx: CreateWalletContext): Wallet {
    enforcePrivateKeySafety(input as unknown as Record<string, unknown>);
    const mode: WalletMode = input.mode ?? ctx.defaultMode;
    const networks: readonly NetworkKind[] = input.supportedNetworks;
    for (const n of networks) {
      this.gate.ensureAllowed(n);
    }
    return Wallet.create({ ...input, mode });
  }
}
