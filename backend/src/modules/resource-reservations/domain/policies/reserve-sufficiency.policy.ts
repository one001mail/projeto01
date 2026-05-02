/**
 * ReserveSufficiencyPolicy.
 *
 * Decides whether a requested amount fits inside the simulated allocation
 * cap declared for the namespace. Pure: caller supplies the cap and the
 * already-reserved total.
 */
import type { ReservationAmount } from '../value-objects/reservation-amount.vo.js';

export interface SufficiencyInput {
  readonly cap: ReservationAmount;
  readonly alreadyReserved: ReservationAmount;
  readonly requested: ReservationAmount;
}

export const ReserveSufficiencyPolicy = {
  isSufficient(input: SufficiencyInput): boolean {
    return !input.cap.isLessThan(input.alreadyReserved.add(input.requested));
  },
} as const;
