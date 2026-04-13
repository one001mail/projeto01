import { supabase } from "@/integrations/supabase/client";

export interface CreateSessionPayload {
  network: "sepolia" | "btc_testnet";
  asset: "ETH" | "BTC";
  output_address: string;
}

export interface SessionResponse {
  session_id: string;
  session_code: string;
  network: string;
  asset: string;
  output_address: string;
  status: string;
  created_at: string;
}

export interface SessionError {
  error_code: string;
  message: string;
}

export async function createSession(payload: CreateSessionPayload): Promise<SessionResponse> {
  const { data, error } = await supabase.functions.invoke("sessions", {
    body: payload,
  });

  if (error) throw new Error(error.message || "Failed to create session");
  if (data?.error_code) throw new Error(data.message || "Server error");

  return data as SessionResponse;
}
