import { useCallback, useMemo, useState } from "react";
import type { Currency, MixOutput, MixStatus } from "@/domain/types";
import { getQuote } from "@/domain/pricing/getQuote";
import { validateMixRequest, type ValidationError } from "@/domain/mixing/validateMixRequest";
import { createMixSession, type MixSessionResponse } from "@/services/mixingApi";

export interface UseMixingFormState {
  amount: string;
  currency: Currency;
  outputs: MixOutput[];
  delay: number;
  status: MixStatus;
  errors: Record<string, string>;
  sessionId: string;
  sessionData: MixSessionResponse | null;
  parsedAmount: number;
  quote: ReturnType<typeof getQuote>;
  setAmount: (v: string) => void;
  setCurrency: (c: Currency) => void;
  setOutputs: (o: MixOutput[]) => void;
  setDelay: (h: number) => void;
  submit: () => Promise<{ ok: boolean; message?: string }>;
  reset: () => void;
}

const errorsToMap = (list: ValidationError[]): Record<string, string> =>
  list.reduce<Record<string, string>>((acc, e) => {
    acc[e.field] = e.message;
    return acc;
  }, {});

export function useMixingForm(): UseMixingFormState {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("BTC");
  const [outputs, setOutputs] = useState<MixOutput[]>([{ address: "", percentage: 100 }]);
  const [delay, setDelay] = useState(6);
  const [status, setStatus] = useState<MixStatus>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState("");
  const [sessionData, setSessionData] = useState<MixSessionResponse | null>(null);

  const parsedAmount = parseFloat(amount) || 0;
  const quote = useMemo(() => getQuote(currency, parsedAmount), [currency, parsedAmount]);

  const submit = useCallback(async () => {
    const validation = validateMixRequest({
      amount: parsedAmount,
      currency,
      outputs,
      delayHours: delay,
    });

    if (validation.length > 0) {
      setErrors(errorsToMap(validation));
      return { ok: false, message: validation[0].message };
    }
    setErrors({});
    setStatus("submitting");

    try {
      const session = await createMixSession({
        currency,
        amount: parsedAmount,
        outputs,
        delay_hours: delay,
      });
      setSessionId(session.session_code);
      setSessionData(session);
      setStatus("complete");
      return { ok: true };
    } catch (err: any) {
      setStatus("idle");
      return { ok: false, message: err?.message || "Erro inesperado." };
    }
  }, [parsedAmount, currency, outputs, delay]);

  const reset = useCallback(() => {
    setStatus("idle");
    setAmount("");
    setOutputs([{ address: "", percentage: 100 }]);
    setDelay(6);
    setSessionId("");
    setSessionData(null);
    setErrors({});
  }, []);

  return {
    amount,
    currency,
    outputs,
    delay,
    status,
    errors,
    sessionId,
    sessionData,
    parsedAmount,
    quote,
    setAmount,
    setCurrency,
    setOutputs,
    setDelay,
    submit,
    reset,
  };
}
