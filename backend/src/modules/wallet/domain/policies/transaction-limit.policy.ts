/**
 * Transaction-limit policy.
 *
 * Compares a decimal-string amount (minor units) against a configured
 * ceiling using BigInt arithmetic so no floating-point precision is lost.
 */
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';

export function ensureWithinLimit(
  amount: string,
  maxAmount: string,
): Ok<true> | Err<{ message: string }> {
  if (!/^[0-9]+$/.test(amount)) {
    return err({ message: 'amount must be a non-negative integer string in minor units' });
  }
  if (!/^[0-9]+$/.test(maxAmount)) {
    return err({ message: 'maxAmount must be a non-negative integer string in minor units' });
  }
  const a = BigInt(amount);
  const max = BigInt(maxAmount);
  if (a === 0n) {
    return err({ message: 'amount must be greater than zero' });
  }
  if (a > max) {
    return err({ message: `amount ${amount} exceeds per-transaction limit ${maxAmount}` });
  }
  return ok(true);
}
