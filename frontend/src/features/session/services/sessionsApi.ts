/**
 * Session feature API surface. All network traffic goes through the shared
 * httpClient — no direct Supabase or fetch calls.
 */
import { httpClient, endpoints, ApiError } from "@/shared/api";

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

export interface SessionErrorPayload {
  error_code: string;
  message: string;
}

export async function createSession(
  payload: CreateSessionPayload,
): Promise<SessionResponse> {
  try {
    return await httpClient.post<SessionResponse>(
      endpoints.sessions.create(),
      { ...payload },
    );
  } catch (err) {
    if (err instanceof ApiError) {
      // Preserve a thrown Error with the server-provided message so existing
      // hooks/React-Query consumers keep working unchanged.
      throw new Error(err.message || "Server error");
    }
    throw err;
  }
}
