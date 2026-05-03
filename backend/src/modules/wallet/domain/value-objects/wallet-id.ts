/**
 * WalletId value object.
 *
 * UUID v4 identifier for wallets. Validated at construction.
 */
import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface WalletIdProps extends Record<string, unknown> {
  readonly value: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class WalletId extends ValueObject<WalletIdProps> {
  static of(value: string): WalletId {
    const v = value.trim().toLowerCase();
    if (!UUID_RE.test(v)) throw new Error('WalletId must be a UUID');
    return new WalletId({ value: v });
  }
  get value(): string {
    return this.props.value;
  }
}
