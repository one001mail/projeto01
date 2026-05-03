/**
 * AssetSymbol VO.
 *
 * Canonical asset ticker: native asset of the selected network (ETH / BTC)
 * or a whitelisted token symbol. Enforced alphanumeric, uppercase.
 */
import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface AssetSymbolProps extends Record<string, unknown> {
  readonly value: string;
}

const SYMBOL_RE = /^[A-Z][A-Z0-9]{0,9}$/;

export class AssetSymbol extends ValueObject<AssetSymbolProps> {
  static of(value: string): AssetSymbol {
    const v = value.trim().toUpperCase();
    if (!SYMBOL_RE.test(v)) {
      throw new Error('AssetSymbol must match /^[A-Z][A-Z0-9]{0,9}$/');
    }
    return new AssetSymbol({ value: v });
  }
  static ETH(): AssetSymbol {
    return AssetSymbol.of('ETH');
  }
  static BTC(): AssetSymbol {
    return AssetSymbol.of('BTC');
  }
  get value(): string {
    return this.props.value;
  }
}
