import { useState } from "react";
import { lookupMixSession, type MixSessionResponse } from "@/services/mixingApi";

export function useSessionLookup() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<MixSessionResponse | null>(null);

  const search = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Informe o código da sessão.");
      return;
    }
    setError(null);
    setSession(null);
    setLoading(true);
    try {
      const result = await lookupMixSession(trimmed);
      setSession(result);
    } catch (err: any) {
      setError(err?.message || "Sessão não encontrada.");
    } finally {
      setLoading(false);
    }
  };

  return { code, setCode, loading, error, session, search };
}
