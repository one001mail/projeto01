/**
 * DerivationPath VO (BIP-32/44/84 style).
 *
 * E.g. `m/44'/60'/0'/0/0` (Ethereum), `m/84'/0'/0'/0/0` (Native SegWit).
 * Public derivation is preferred — see `PublicAddressDerivationProvider`.
 */
import { ValueObject } from '../../../../shared/domain/value-object.js';

export interface DerivationPathProps extends Record<string, unknown> {
  readonly value: string;
}

const PATH_RE = /^m(\/[0-9]+'?)*$/;

export class DerivationPath extends ValueObject<DerivationPathProps> {
  static of(value: string): DerivationPath {
    const v = value.trim();
    if (!PATH_RE.test(v)) {
      throw new Error(`Invalid BIP-32 derivation path: '${value}'`);
    }
    return new DerivationPath({ value: v });
  }
  get value(): string {
    return this.props.value;
  }
}
