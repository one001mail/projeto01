/**
 * Money value object.
 *
 * Sandbox-only abstraction of a monetary amount. There is NO real currency
 * handling here, NO FX conversion, NO custody of funds. Values are plain
 * integers in the smallest unit of the asset (e.g. satoshis) and exist
 * purely to illustrate the mixing calculator math.
 *
 * NOT A REAL BITCOIN AMOUNT. NOT A WALLET BALANCE. NOT SPENDABLE.
 */
import { ValueObject } from './value-object.js';

export type MoneyCurrency = 'BTC' | 'ETH' | 'USDT' | 'SANDBOX';

export interface MoneyProps extends Record<string, unknown> {
  readonly amount: number;
  readonly currency: MoneyCurrency;
}

export class Money extends ValueObject<MoneyProps> {
  static zero(currency: MoneyCurrency): Money {
    return new Money({ amount: 0, currency });
  }

  static of(amount: number, currency: MoneyCurrency): Money {
    if (!Number.isFinite(amount)) throw new Error('Money.amount must be finite');
    if (amount < 0) throw new Error('Money.amount must be non-negative');
    return new Money({ amount, currency });
  }

  get amount(): number {
    return this.props.amount;
  }
  get currency(): MoneyCurrency {
    return this.props.currency;
  }

  plus(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.of(this.amount + other.amount, this.currency);
  }

  minus(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.of(Math.max(0, this.amount - other.amount), this.currency);
  }

  private assertSameCurrency(other: Money): void {
    if (other.currency !== this.currency) {
      throw new Error(`Money currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}
