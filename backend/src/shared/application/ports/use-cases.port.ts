/**
 * Use case ports exposed by domain modules to the shared HTTP layer.
 *
 * The `api/` layer is forbidden by the boundary checker from importing
 * concrete use cases living under `modules/<ctx>/application/`. Modules
 * populate the registry below during their `register*Module()` plugin so
 * that the shared HTTP layer can call them through ports only.
 *
 * Every entry mirrors a real use case 1:1; structural typing is enough —
 * the existing classes already satisfy these interfaces without changes.
 *
 * Sandbox-only contract (mix sessions):
 *   * `mixSession.create` and `mixSession.get` are educational/sandbox
 *     operations. They do NOT submit transactions, do NOT touch chains,
 *     do NOT promise anonymity. The shared HTTP layer is responsible for
 *     adding `simulated: true` and a disclaimer to every response.
 */
import type { Result } from '../../types/result.js';

// ---------------------------------------------------------------------------
// Mix session (educational sandbox session). Maps onto the
// `learning-sessions` module under the hood.
// ---------------------------------------------------------------------------

export type MixSessionStatus = 'pending' | 'active' | 'completed' | 'expired';

export interface MixSessionDtoFromUseCase {
  readonly id: string;
  readonly publicCode: string;
  readonly status: MixSessionStatus;
  readonly subject: string | null;
  readonly inputValue: number | null;
  readonly computedResult: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly expiresAt: Date | null;
}

export interface MixSessionCreateInput {
  readonly subject?: string | null;
  readonly inputValue?: number | null;
  readonly expiresInSeconds?: number | null;
}

export type MixSessionCreateError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'COLLISION'; message: string };

export interface MixSessionCreateUseCasePort {
  execute(
    input: MixSessionCreateInput,
  ): Promise<Result<MixSessionDtoFromUseCase, MixSessionCreateError>>;
}

export interface MixSessionGetInput {
  readonly publicCode: string;
}

export type MixSessionGetError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'NOT_FOUND'; message: string };

export interface MixSessionGetUseCasePort {
  execute(input: MixSessionGetInput): Promise<Result<MixSessionDtoFromUseCase, MixSessionGetError>>;
}

// ---------------------------------------------------------------------------
// Contact (generic contact intake). Maps onto the `contact-requests` module.
// ---------------------------------------------------------------------------

export interface ContactSubmitInput {
  readonly name: string;
  readonly email: string;
  readonly subject?: string | null;
  readonly message: string;
}

export type ContactSubmitError = { kind: 'INVALID_INPUT'; message: string };

export interface ContactSubmitDtoFromUseCase {
  readonly id: string;
  readonly status: 'received' | 'processed' | 'archived';
  readonly createdAt: Date;
}

export interface ContactSubmitUseCasePort {
  execute(
    input: ContactSubmitInput,
  ): Promise<Result<ContactSubmitDtoFromUseCase, ContactSubmitError>>;
}

// ---------------------------------------------------------------------------
// Pricing (read-only snapshot used by the quote calculator).
// ---------------------------------------------------------------------------

export type PricingCurrency = 'BTC' | 'ETH' | 'USDT';

export interface PricingSnapshotDto {
  readonly currencies: readonly PricingCurrency[];
  readonly feeBps: number;
  readonly minAmounts: Readonly<Record<PricingCurrency, number>>;
  readonly maxAmounts: Readonly<Record<PricingCurrency, number>>;
  readonly delayOptionsHours: readonly number[];
  readonly disclaimer: string;
  readonly version: string;
}

export interface PricingGetResultDto {
  readonly pricing: PricingSnapshotDto;
  readonly retrievedAt: string;
}

export interface PricingGetUseCasePort {
  execute(): Promise<Result<PricingGetResultDto, never>>;
}

// ---------------------------------------------------------------------------
// Registry attached to AppContext.
// ---------------------------------------------------------------------------

export interface UseCaseRegistry {
  mixSession?: {
    readonly create: MixSessionCreateUseCasePort;
    readonly get: MixSessionGetUseCasePort;
  };
  contact?: {
    readonly submit: ContactSubmitUseCasePort;
  };
  pricing?: {
    readonly get: PricingGetUseCasePort;
  };
}

export function createUseCaseRegistry(): UseCaseRegistry {
  return {};
}
