/**
 * Get Pricing use case.
 *
 * Read-only; returns the current pricing snapshot plus the timestamp at
 * which it was read (so clients can cache sensibly).
 */
import type { Clock } from '../../../shared/application/ports/clock.port.js';
import { type Ok, ok } from '../../../shared/types/result.js';
import { CURRENT_PRICING, type PricingSnapshot } from '../domain/pricing.js';

export interface GetPricingResult {
  pricing: PricingSnapshot;
  retrievedAt: string;
}

export interface GetPricingDeps {
  clock: Clock;
}

export class GetPricingUseCase {
  constructor(private readonly deps: GetPricingDeps) {}

  async execute(): Promise<Ok<GetPricingResult>> {
    return ok({
      pricing: CURRENT_PRICING,
      retrievedAt: this.deps.clock.now().toISOString(),
    });
  }
}
