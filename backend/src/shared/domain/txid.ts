/**
 * Transaction id (TxId) value object — SANDBOX-ONLY.
 *
 * Does NOT validate real Bitcoin/Ethereum transaction ids and is not tied
 * to any live blockchain. This is a mock identifier used by the simulated
 * blockchain-monitor module to label fake observed events.
 */
import { ValueObject } from './value-object.js';

export interface TxIdProps extends Record<string, unknown> {
  readonly value: string;
}

const MOCK_TXID_RE = /^mocktx_[a-f0-9]{8,64}$/;

export class TxId extends ValueObject<TxIdProps> {
  static of(value: string): TxId {
    if (typeof value !== 'string') throw new Error('TxId must be a string');
    const trimmed = value.trim().toLowerCase();
    if (!MOCK_TXID_RE.test(trimmed)) {
      throw new Error(
        'TxId is not a valid sandbox id (expected prefix "mocktx_" and 8..64 hex chars).',
      );
    }
    return new TxId({ value: trimmed });
  }

  /** Sandbox-only: NOT a real on-chain tx. */
  static readonly isReal = false;

  get value(): string {
    return this.props.value;
  }
}
