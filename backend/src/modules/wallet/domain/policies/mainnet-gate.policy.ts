/**
 * Mainnet gate policy.
 *
 * Refuses any wallet operation on mainnet networks unless explicitly
 * enabled via configuration. The policy is a pure object; the infra
 * layer passes `mainnetEnabled` from the validated environment.
 */
import { MainnetDisabledError } from '../errors/mainnet-disabled.error.js';
import type { NetworkKind } from '../value-objects/network.js';

const MAINNETS: readonly NetworkKind[] = ['ethereum-mainnet', 'bitcoin-mainnet'];

export class MainnetGatePolicy {
  constructor(private readonly mainnetEnabled: boolean) {}

  isMainnet(network: NetworkKind): boolean {
    return MAINNETS.includes(network);
  }

  ensureAllowed(network: NetworkKind): void {
    if (this.isMainnet(network) && !this.mainnetEnabled) {
      throw new MainnetDisabledError(network);
    }
  }
}
