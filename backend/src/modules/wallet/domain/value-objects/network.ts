/**
 * Network value object.
 *
 * Enumerates the blockchain networks this module can speak to. Testnets
 * are the default; mainnets are accepted at the VO level but gated by
 * policy at the use-case boundary (see `mainnet-gate.policy.ts`).
 */
import { ValueObject } from '../../../../shared/domain/value-object.js';

export type NetworkKind =
  | 'ethereum-sepolia'
  | 'ethereum-mainnet'
  | 'bitcoin-testnet'
  | 'bitcoin-mainnet';

export type NetworkFamily = 'ethereum' | 'bitcoin';

export interface NetworkProps extends Record<string, unknown> {
  readonly kind: NetworkKind;
}

const KINDS: readonly NetworkKind[] = [
  'ethereum-sepolia',
  'ethereum-mainnet',
  'bitcoin-testnet',
  'bitcoin-mainnet',
];

export class Network extends ValueObject<NetworkProps> {
  static of(value: string): Network {
    const v = value.trim().toLowerCase() as NetworkKind;
    if (!KINDS.includes(v)) {
      throw new Error(`Unsupported network '${value}'. Allowed: ${KINDS.join(', ')}`);
    }
    return new Network({ kind: v });
  }
  get kind(): NetworkKind {
    return this.props.kind;
  }
  get family(): NetworkFamily {
    return this.props.kind.startsWith('ethereum') ? 'ethereum' : 'bitcoin';
  }
  get isMainnet(): boolean {
    return this.props.kind === 'ethereum-mainnet' || this.props.kind === 'bitcoin-mainnet';
  }
  get isTestnet(): boolean {
    return !this.isMainnet;
  }
}
