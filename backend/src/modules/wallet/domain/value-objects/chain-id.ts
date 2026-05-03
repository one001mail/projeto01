/**
 * ChainId VO (Ethereum-style numeric chain id).
 *
 * Bitcoin networks carry no chain id; the VO is optional on WalletAddress.
 */
import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface ChainIdProps extends Record<string, unknown> {
  readonly value: number;
}

export class ChainId extends ValueObject<ChainIdProps> {
  static of(value: number): ChainId {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error('ChainId must be a positive integer');
    }
    return new ChainId({ value });
  }
  get value(): number {
    return this.props.value;
  }
}
