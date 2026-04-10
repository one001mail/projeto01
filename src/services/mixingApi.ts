import { supabase } from "@/integrations/supabase/client";
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
}

export async function createMixSession(payload: CreateMixSessionPayload): Promise<MixSessionResponse> {
  const { data, error } = await supabase.functions.invoke("mix-session", {
    body: {
      currency: payload.currency,
      amount: payload.amount,
      outputs: payload.outputs.map(o => ({ address: o.address.trim(), percentage: o.percentage })),
      delay_hours: payload.delay_hours,
    },
  });

  if (error) throw new Error(error.message || "Failed to create session");
  if (data?.error) throw new Error(data.error);
  if (!data?.session) throw new Error("Invalid response from server");

  return data.session as MixSessionResponse;
}

export async function lookupMixSession(sessionCode: string): Promise<MixSessionResponse> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/mix-session?session_code=${encodeURIComponent(sessionCode)}`,
    {
      method: "GET",
      headers: {
        "apikey": anonKey,
        "Authorization": `Bearer ${anonKey}`,
      },
    }
  );

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  if (!json.session) throw new Error("Session not found");

  return json.session as MixSessionResponse;
}
