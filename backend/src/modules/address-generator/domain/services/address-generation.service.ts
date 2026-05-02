/**
 * Address Generation Service — sandbox-only.
 *
 * Pure factory for mock address tokens. No crypto derivation, no seed,
 * no RPC. Callers pass a token string already produced by an
 * `infra/providers/mock-address.provider.ts` adapter.
 */
import type { AddressToken } from '../entities/address-token.entity.js';
import { AddressToken as AddressTokenImpl } from '../entities/address-token.entity.js';

export interface GenerateAddressInput {
  readonly id: string;
  readonly namespace: string;
  readonly mockToken: string;
  readonly correlationId?: string | null;
  readonly expiresAt?: Date | null;
  readonly now?: Date;
}

export class AddressGenerationService {
  issue(input: GenerateAddressInput): AddressToken {
    return AddressTokenImpl.issue(input);
  }
}
