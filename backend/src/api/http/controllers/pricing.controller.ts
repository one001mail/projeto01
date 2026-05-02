import type {
  PricingCurrency,
  PricingGetUseCasePort,
} from '../../../shared/application/ports/use-cases.port.js';
/**
 * Pricing controller (quote calculator).
 *
 * Reads the current pricing snapshot through the `pricing.get` use case
 * port (no DB calls of its own) and computes a sandbox quote in-memory.
 * Validates that the requested amount fits the snapshot's min/max bounds
 * for the chosen currency; rejects with HTTP 422 otherwise.
 */
import { AppError } from '../../../shared/errors/app-error.js';
import { makeSandboxNotice } from '../schemas/common.schemas.js';
import type { PricingQuoteDto, PricingQuoteQuery } from '../schemas/pricing.schemas.js';

export interface PricingControllerDeps {
  readonly get: PricingGetUseCasePort;
}

function round(value: number, decimals = 8): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export class PricingController {
  constructor(private readonly deps: PricingControllerDeps) {}

  async quote(query: PricingQuoteQuery): Promise<PricingQuoteDto> {
    const snapshotResult = await this.deps.get.execute();
    // PricingGetUseCasePort returns Result<_, never>: the success branch is the only one.
    if (!snapshotResult.ok) {
      throw AppError.serviceUnavailable('Pricing snapshot unavailable');
    }
    const { pricing, retrievedAt } = snapshotResult.value;
    const currency = query.currency as PricingCurrency;
    const min = pricing.minAmounts[currency];
    const max = pricing.maxAmounts[currency];

    if (query.amount < min) {
      throw AppError.unprocessable(`amount is below the minimum for ${currency}`, {
        min,
        max,
        currency,
      });
    }
    if (query.amount > max) {
      throw AppError.unprocessable(`amount is above the maximum for ${currency}`, {
        min,
        max,
        currency,
      });
    }

    const requestedDelay =
      typeof query.delayHours === 'number' ? query.delayHours : (pricing.delayOptionsHours[0] ?? 6);
    const delayHours =
      pricing.delayOptionsHours.find((h) => h === requestedDelay) ??
      pricing.delayOptionsHours[0] ??
      6;

    const fee = (query.amount * pricing.feeBps) / 10_000;
    const net = query.amount - fee;
    const computedAt = new Date(retrievedAt);
    const expectedDeliveryAt = new Date(computedAt.getTime() + delayHours * 60 * 60 * 1_000);

    return {
      currency,
      gross: round(query.amount),
      feeBps: pricing.feeBps,
      fee: round(fee),
      net: round(net),
      minAmount: min,
      maxAmount: max,
      delayHours,
      expectedDeliveryAt: expectedDeliveryAt.toISOString(),
      pricingVersion: pricing.version,
      computedAt: computedAt.toISOString(),
      sandboxNotice: makeSandboxNotice(),
    };
  }
}
