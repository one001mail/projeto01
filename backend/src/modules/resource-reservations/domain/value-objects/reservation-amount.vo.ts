/**
 * ReservationAmount value object.
 *
 * Unitless, non-negative quota slot used by the sandbox simulation.
 * NOT a financial amount, NOT a blockchain unit. Pure value object.
 */
const MAX_AMOUNT = 1_000_000_000;
const SCALE = 1_000_000; // 6 decimal places, mirrors numeric(20,6)

export class ReservationAmount {
  private constructor(private readonly raw: number) {}

  static of(value: number | string): ReservationAmount {
    const n = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(n)) throw new Error('ReservationAmount must be finite');
    if (n < 0) throw new Error('ReservationAmount must be >= 0');
    if (n > MAX_AMOUNT) throw new Error(`ReservationAmount must be <= ${MAX_AMOUNT}`);
    // Round to 6 decimals to mirror DB precision deterministically.
    const rounded = Math.round(n * SCALE) / SCALE;
    return new ReservationAmount(rounded);
  }

  toNumber(): number {
    return this.raw;
  }

  toString(): string {
    return this.raw.toString();
  }

  add(other: ReservationAmount): ReservationAmount {
    return ReservationAmount.of(this.raw + other.raw);
  }

  subtract(other: ReservationAmount): ReservationAmount {
    return ReservationAmount.of(this.raw - other.raw);
  }

  isZero(): boolean {
    return this.raw === 0;
  }

  isLessThan(other: ReservationAmount): boolean {
    return this.raw < other.raw;
  }

  equals(other: ReservationAmount): boolean {
    return this.raw === other.raw;
  }
}
