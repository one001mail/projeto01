/**
 * Pricing feature API service.
 *
 * Reads the backend pricing snapshot (GET /api/pricing). Consumers can use
 * this to replace the currently-static `@/domain/pricing/pricingRules` in
 * future phases; P4 only wires the network-level transport so the endpoint
 * is reachable and typed. Nothing in the app must `fetch` this path by hand.
 */
import { httpClient, endpoints } from "@/shared/api";

export interface BackendPricingSnapshot {
  currencies: string[];
  feeBps: number;
  minAmounts: Record<string, number>;
  maxAmounts: Record<string, number>;
  delayOptionsHours: number[];
  disclaimer: string;
  version: string;
}

export interface BackendPricingEnvelope {
  pricing: BackendPricingSnapshot;
  retrievedAt: string;
}

export async function fetchPricing(): Promise<BackendPricingEnvelope> {
  return httpClient.get<BackendPricingEnvelope>(endpoints.pricing());
}
