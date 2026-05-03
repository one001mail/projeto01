/**
 * TransactionHash VO.
 *
 * Hex string tx id (0x-prefixed for Ethereum, bare hex for Bitcoin).
 */
import { ValueObject } from '../../../../shared/domain/value-object.js';
import type { NetworkFamily } from './network.js';

export interface TransactionHashProps extends Record<string, unknown> {
  readonly value: string;
}

const ETH_TX_RE = /^0x[0-9a-fA-F]{64}$/;
const BTC_TX_RE = /^[0-9a-fA-F]{64}$/;

export class TransactionHash extends ValueObject<TransactionHashProps> {
  static of(value: string, family: NetworkFamily): TransactionHash {
    const v = value.trim();
    if (family === 'ethereum' && !ETH_TX_RE.test(v)) {
      throw new Error('Invalid Ethereum transaction hash');
    }
    if (family === 'bitcoin' && !BTC_TX_RE.test(v)) {
      throw new Error('Invalid Bitcoin transaction hash');
    }
    return new TransactionHash({ value: v });
  }
  get value(): string {
    return this.props.value;
  }
}
