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
// Audit logs (admin-only consumer of the cross-cutting `audit_logs` table).
// ---------------------------------------------------------------------------

export interface AuditLogEntryDto {
  readonly id: string;
  readonly scope: string;
  readonly action: string;
  readonly redactedPayload: Record<string, unknown>;
  readonly requestId: string | null;
  readonly actorId: string | null;
  readonly createdAt: string;
}

export interface AuditLogsListInput {
  readonly query: {
    readonly limit?: number | undefined;
    readonly offset?: number | undefined;
    readonly scope?: string | undefined;
    readonly action?: string | undefined;
  };
  readonly subject: { readonly actorId: string | null; readonly isAdmin: boolean };
}

export interface AuditLogsListDto {
  readonly entries: readonly AuditLogEntryDto[];
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
  readonly retrievedAt: string;
}

export type AuditLogsListError =
  | { kind: 'FORBIDDEN'; message: string }
  | { kind: 'INVALID_INPUT'; message: string };

export interface AuditLogsListUseCasePort {
  execute(input: AuditLogsListInput): Promise<Result<AuditLogsListDto, AuditLogsListError>>;
}

export interface AuditLogsGetDetailInput {
  readonly id: string;
  readonly subject: { readonly actorId: string | null; readonly isAdmin: boolean };
}

export type AuditLogsGetDetailError =
  | { kind: 'FORBIDDEN'; message: string }
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'NOT_FOUND'; message: string };

export interface AuditLogsGetDetailUseCasePort {
  execute(
    input: AuditLogsGetDetailInput,
  ): Promise<Result<AuditLogEntryDto, AuditLogsGetDetailError>>;
}

export interface AuditLogsCleanupInput {
  readonly retentionDays: number;
  readonly subject: { readonly actorId: string | null; readonly isAdmin: boolean };
}

export interface AuditLogsCleanupDto {
  readonly removedCount: number;
  readonly cutoff: string | null;
  readonly cleanupEnabled: boolean;
  readonly executedAt: string;
}

export type AuditLogsCleanupError =
  | { kind: 'FORBIDDEN'; message: string }
  | { kind: 'INVALID_INPUT'; message: string };

export interface AuditLogsCleanupUseCasePort {
  execute(
    input: AuditLogsCleanupInput,
  ): Promise<Result<AuditLogsCleanupDto, AuditLogsCleanupError>>;
}

// ---------------------------------------------------------------------------
// Generated tokens (sandbox-only opaque identifiers; NOT blockchain addresses).
// ---------------------------------------------------------------------------

export type GeneratedTokenStatus = 'active' | 'revoked' | 'expired';

export interface GeneratedTokenDto {
  readonly id: string;
  readonly namespace: string;
  readonly token: string;
  readonly status: GeneratedTokenStatus;
  readonly metadata: Record<string, string>;
  readonly createdAt: string;
  readonly expiresAt: string | null;
  readonly disclaimer: string;
}

export interface GenerateTokenInput {
  readonly namespace: string;
  readonly ttlSeconds?: number | null;
  readonly metadata?: Record<string, string> | null;
}

export type GenerateTokenError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'COLLISION'; message: string };

export interface GenerateTokenUseCasePort {
  execute(input: GenerateTokenInput): Promise<Result<GeneratedTokenDto, GenerateTokenError>>;
}

export interface RevokeTokenInput {
  readonly id: string;
}

export type RevokeTokenError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'NOT_FOUND'; message: string }
  | { kind: 'INVALID_STATE'; message: string };

export interface RevokeTokenUseCasePort {
  execute(input: RevokeTokenInput): Promise<Result<GeneratedTokenDto, RevokeTokenError>>;
}

export interface ExpireTokenInput {
  readonly id: string;
}

export type ExpireTokenError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'NOT_FOUND'; message: string };

export interface ExpireTokenUseCasePort {
  execute(input: ExpireTokenInput): Promise<Result<GeneratedTokenDto, ExpireTokenError>>;
}

export interface GetTokenMetadataInput {
  readonly id: string;
}

export type GetTokenMetadataError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'NOT_FOUND'; message: string };

export interface GetTokenMetadataUseCasePort {
  execute(input: GetTokenMetadataInput): Promise<Result<GeneratedTokenDto, GetTokenMetadataError>>;
}

// ---------------------------------------------------------------------------
// Resource reservations (sandbox simulation; NOT real custody).
// ---------------------------------------------------------------------------

export type ResourceReservationStatus = 'reserved' | 'released' | 'expired' | 'failed';

export interface ResourceReservationDto {
  readonly id: string;
  readonly namespace: string;
  readonly sessionId: string;
  readonly amount: number;
  readonly status: ResourceReservationStatus;
  readonly createdAt: string;
  readonly releasedAt: string | null;
  readonly expiresAt: string | null;
  readonly disclaimer: string;
}

export interface ReserveResourceInput {
  readonly namespace: string;
  readonly sessionId: string;
  readonly amount: number;
  readonly ttlSeconds?: number | null;
}

export type ReserveResourceError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'INSUFFICIENT_ALLOCATION'; message: string }
  | { kind: 'COLLISION'; message: string };

export interface ReserveResourceUseCasePort {
  execute(
    input: ReserveResourceInput,
  ): Promise<Result<ResourceReservationDto, ReserveResourceError>>;
}

export interface ReleaseResourceInput {
  readonly id: string;
}

export type ReleaseResourceError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'NOT_FOUND'; message: string }
  | { kind: 'INVALID_STATE'; message: string };

export interface ReleaseResourceUseCasePort {
  execute(
    input: ReleaseResourceInput,
  ): Promise<Result<ResourceReservationDto, ReleaseResourceError>>;
}

export interface GetReservationStatusInput {
  readonly id: string;
}

export type GetReservationStatusError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'NOT_FOUND'; message: string };

export interface GetReservationStatusUseCasePort {
  execute(
    input: GetReservationStatusInput,
  ): Promise<Result<ResourceReservationDto, GetReservationStatusError>>;
}

export interface ReconcileReservationsInput {
  readonly namespace?: string | undefined;
}

export interface ReconcileReservationsDto {
  readonly expired: number;
  readonly executedAt: string;
}

export type ReconcileReservationsError = { kind: 'INVALID_INPUT'; message: string };

export interface ReconcileReservationsUseCasePort {
  execute(
    input: ReconcileReservationsInput,
  ): Promise<Result<ReconcileReservationsDto, ReconcileReservationsError>>;
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
  auditLogs?: {
    readonly list: AuditLogsListUseCasePort;
    readonly getDetail: AuditLogsGetDetailUseCasePort;
    readonly cleanup: AuditLogsCleanupUseCasePort;
  };
  generatedTokens?: {
    readonly generate: GenerateTokenUseCasePort;
    readonly revoke: RevokeTokenUseCasePort;
    readonly expire: ExpireTokenUseCasePort;
    readonly getMetadata: GetTokenMetadataUseCasePort;
  };
  resourceReservations?: {
    readonly reserve: ReserveResourceUseCasePort;
    readonly release: ReleaseResourceUseCasePort;
    readonly reconcile: ReconcileReservationsUseCasePort;
    readonly getStatus: GetReservationStatusUseCasePort;
  };
}

export function createUseCaseRegistry(): UseCaseRegistry {
  return {};
}
