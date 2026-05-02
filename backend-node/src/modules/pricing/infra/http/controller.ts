/**
 * Pricing controller.
 */
import type {
  GetPricingResult,
  GetPricingUseCase,
} from '../../application/get-pricing.use-case.js';

export interface PricingControllerDeps {
  getUc: GetPricingUseCase;
}

export class PricingController {
  constructor(private readonly deps: PricingControllerDeps) {}

  async get(): Promise<GetPricingResult> {
    const result = await this.deps.getUc.execute();
    return result.value;
  }
}
