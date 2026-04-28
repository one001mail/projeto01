import { useMutation } from "@tanstack/react-query";
import { createSession, type CreateSessionPayload, type SessionResponse } from "@/services/sessionsApi";

export function useCreateSession() {
  return useMutation<SessionResponse, Error, CreateSessionPayload>({
    mutationFn: createSession,
    retry: false,
  });
}
