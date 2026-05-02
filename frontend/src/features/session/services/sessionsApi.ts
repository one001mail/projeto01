/**
 * Session feature API surface.
 *
 * P4 wiring: points at the unified backend `POST /api/learning-sessions`.
 * Like `mixingApi`, we reconstruct the session-specific fields (network,
 * asset, output_address) from the request payload — the backend has a
 * neutral learning-session DTO and does not persist those yet.
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

interface LearningSessionDto {
  id: string;
  publicCode: string;
  status: string;
  createdAt: string;
}

interface LearningSessionEnvelope {
  session: LearningSessionDto;
}

function buildSubject(payload: CreateSessionPayload): string {
  return `session:${payload.network}:${payload.asset}`;
}

export async function createSession(
  payload: CreateSessionPayload,
): Promise<SessionResponse> {
  try {
    const data = await httpClient.post<LearningSessionEnvelope>(
      endpoints.learningSessions.create(),
      { subject: buildSubject(payload) },
    );

    const envelope = data as { session?: LearningSessionDto };
    const dto = envelope.session;
    if (!dto || typeof dto !== "object" || !("publicCode" in dto)) {
      throw new Error("Invalid response from server");
    }

    return {
      session_id: dto.id,
      session_code: dto.publicCode,
      network: payload.network,
      asset: payload.asset,
      output_address: payload.output_address,
      status: dto.status,
      created_at: dto.createdAt,
    };
  } catch (err) {
    if (err instanceof ApiError) {
      // Preserve a thrown Error with the server-provided message so existing
      // hooks/React-Query consumers keep working unchanged.
      throw new Error(err.message || "Server error");
    }
    throw err;
  }
}
