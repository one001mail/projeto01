/**
 * Mixing feature API surface. All network traffic goes through the shared
 * httpClient — no direct Supabase or fetch calls.
 *
 * P4 wiring: targets the new backend `learning-sessions` endpoints.
 * The backend's `LearningSessionDto` is narrower than the legacy
 * `MixSessionResponse` the UI expects (it has `id`, `publicCode`, `status`,
 * `subject`, `inputValue`, `computedResult`, `createdAt`, `updatedAt`,
 * `expiresAt` and no payment-specific fields). This module keeps the legacy
 * UI contract stable by:
 *   - POST: reconstructing mix-context fields (currency / amount / outputs /
 *     delay_hours) from the request payload the caller already owns.
 *   - GET : returning sensible defaults for fields the backend doesn't
 *     retain yet. Lookup therefore succeeds (no 404) and the UI renders the
 *     session status + public code — future phases can extend the backend
 *     DTO with the missing fields.
 */
import { httpClient, endpoints } from "@/shared/api";
import type { Currency, MixOutput } from "@/domain/types";

export interface CreateMixSessionPayload {
  currency: Currency;
  amount: number;
  outputs: MixOutput[];
  delay_hours: number;
}

export interface MixSessionResponse {
  id: string;
  session_code: string;
  currency: string;
  amount: number;
  fee_rate: number;
  fee_amount: number;
  net_amount: number;
  delay_hours: number;
  status: string;
  created_at: string;
  outputs: { address: string; percentage: number }[];
  deposit_address?: string | null;
  coinbase_charge_id?: string | null;
  coinbase_addresses?: Record<string, string>;
}

interface LearningSessionDto {
  id: string;
  publicCode: string;
  status: string;
  subject: string | null;
  inputValue: number | null;
  computedResult: number | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

interface LearningSessionEnvelope {
  session: LearningSessionDto;
}

const DEFAULT_FEE_RATE = 0.01; // Matches backend pricing.feeBps = 100 (1.00%)

function extractSession(data: unknown): LearningSessionDto {
  if (data && typeof data === "object" && "session" in data) {
    const candidate = (data as { session?: unknown }).session;
    if (candidate && typeof candidate === "object" && "publicCode" in candidate) {
      return candidate as LearningSessionDto;
    }
  }
  throw new Error("Invalid response from server");
}

/**
 * Compose a MixSessionResponse from the backend DTO + the request context.
 * On CREATE we know the full payment envelope; on LOOKUP we fall back to
 * defaults for the fields the backend does not currently persist.
 */
function toMixSessionResponse(
  dto: LearningSessionDto,
  ctx: Partial<CreateMixSessionPayload>,
): MixSessionResponse {
  const amount = ctx.amount ?? 0;
  const feeRate = DEFAULT_FEE_RATE;
  const feeAmount = Number((amount * feeRate).toFixed(8));
  const netAmount = Number((amount - feeAmount).toFixed(8));

  return {
    id: dto.id,
    session_code: dto.publicCode,
    currency: ctx.currency ?? "BTC",
    amount,
    fee_rate: feeRate,
    fee_amount: feeAmount,
    net_amount: netAmount,
    delay_hours: ctx.delay_hours ?? 0,
    status: dto.status,
    created_at: dto.createdAt,
    outputs: ctx.outputs
      ? ctx.outputs.map((o) => ({ address: o.address.trim(), percentage: o.percentage }))
      : [],
    deposit_address: null,
    coinbase_charge_id: null,
    coinbase_addresses: {},
  };
}

function buildSubject(payload: CreateMixSessionPayload): string {
  return `mixing:${payload.currency}:${payload.amount}:delay=${payload.delay_hours}h`;
}

export async function createMixSession(
  payload: CreateMixSessionPayload,
): Promise<MixSessionResponse> {
  const data = await httpClient.post<LearningSessionEnvelope>(
    endpoints.learningSessions.create(),
    {
      subject: buildSubject(payload),
      inputValue: payload.amount,
      expiresInSeconds: Math.max(1, Math.round(payload.delay_hours * 3600)),
    },
  );

  const dto = extractSession(data);
  return toMixSessionResponse(dto, payload);
}

export async function lookupMixSession(
  sessionCode: string,
): Promise<MixSessionResponse> {
  const data = await httpClient.get<LearningSessionEnvelope>(
    endpoints.learningSessions.byPublicCode(sessionCode),
  );

  const dto = extractSession(data);
  return toMixSessionResponse(dto, {});
}
