/**
 * Mixing feature API surface. All network traffic goes through the shared
 * httpClient — no direct Supabase or fetch calls.
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

interface MixSessionEnvelope {
  session: MixSessionResponse;
}

export async function createMixSession(
  payload: CreateMixSessionPayload,
): Promise<MixSessionResponse> {
  const data = await httpClient.post<MixSessionEnvelope | MixSessionResponse>(
    endpoints.mixSessions.create(),
    {
      currency: payload.currency,
      amount: payload.amount,
      outputs: payload.outputs.map((o) => ({
        address: o.address.trim(),
        percentage: o.percentage,
      })),
      delay_hours: payload.delay_hours,
    },
  );

  const session =
    (data as MixSessionEnvelope).session ?? (data as MixSessionResponse);
  if (!session || typeof session !== "object" || !("session_code" in session)) {
    throw new Error("Invalid response from server");
  }
  return session;
}

export async function lookupMixSession(
  sessionCode: string,
): Promise<MixSessionResponse> {
  const data = await httpClient.get<MixSessionEnvelope | MixSessionResponse>(
    endpoints.mixSessions.byCode(sessionCode),
  );

  const session =
    (data as MixSessionEnvelope).session ?? (data as MixSessionResponse);
  if (!session || typeof session !== "object" || !("session_code" in session)) {
    throw new Error("Session not found");
  }
  return session;
}
