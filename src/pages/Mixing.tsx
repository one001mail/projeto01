import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import OutputAddresses from "@/components/mixing/OutputAddresses";
import MixingComplete from "@/components/mixing/MixingComplete";
import type { Currency, MixOutput, MixStatus } from "@/domain/types";
import { CURRENCIES, CURRENCY_LABELS } from "@/domain/types";
import { getQuote, formatCryptoAmount } from "@/domain/pricing/getQuote";
import { validateMixRequest } from "@/domain/mixing/validateMixRequest";
import { createMixSession } from "@/services/mixingApi";

const Mixing = () => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("BTC");
  const [outputs, setOutputs] = useState<MixOutput[]>([{ address: "", percentage: 100 }]);
  const [delay, setDelay] = useState([6]);
  const [status, setStatus] = useState<MixStatus>("idle");
  const [sessionId, setSessionId] = useState("");
  const [sessionData, setSessionData] = useState<any>(null);

  const parsedAmount = parseFloat(amount) || 0;
  const quote = getQuote(currency, parsedAmount);

  const handleSubmit = async () => {
    const errors = validateMixRequest({
      amount: parsedAmount,
      currency,
      outputs,
      delayHours: delay[0],
    });

    if (errors.length > 0) {
      toast({ title: "Erro de validação", description: errors[0].message, variant: "destructive" });
      return;
    }

    setStatus("submitting");

    try {
      const session = await createMixSession({
        currency,
        amount: parsedAmount,
        outputs,
        delay_hours: delay[0],
      });

      setSessionId(session.session_code);
      setSessionData(session);
      setStatus("complete");
      toast({ title: "Sessão de Mix Criada", description: `Sessão ${session.session_code} registrada.` });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Erro interno", variant: "destructive" });
      setStatus("idle");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setAmount("");
    setOutputs([{ address: "", percentage: 100 }]);
    setSessionId("");
    setSessionData(null);
  };

  if (status === "complete") {
    const displayFee = sessionData ? formatCryptoAmount(sessionData.fee_amount) : formatCryptoAmount(quote.fee);
    const displayNet = sessionData ? formatCryptoAmount(sessionData.net_amount) : formatCryptoAmount(quote.net);
    const displayRate = sessionData ? (sessionData.fee_rate * 100).toFixed(1) : quote.ratePercent;

    return (
      <Layout>
        <MixingComplete
          sessionId={sessionId}
          amount={amount}
          currency={currency}
          fee={displayFee}
          netAmount={displayNet}
          ratePercent={displayRate}
          delay={delay[0]}
          outputs={outputs}
          onReset={handleReset}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-20">
        <div className="container max-w-lg">
          <h1 className="text-3xl font-bold mb-2 text-center">
            Iniciar um <span className="text-gradient-green">Mix</span>
          </h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            Configure os parâmetros de mixing abaixo. Todos os campos são obrigatórios.
          </p>

          <div className="glass-card p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="amount" className="text-xs font-mono text-muted-foreground">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 font-mono bg-muted border-border"
                  disabled={status !== "idle"}
                />
              </div>
              <div>
                <Label className="text-xs font-mono text-muted-foreground">Moeda</Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)} disabled={status !== "idle"}>
                  <SelectTrigger className="mt-1 font-mono bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{CURRENCY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <OutputAddresses outputs={outputs} onChange={setOutputs} disabled={status !== "idle"} />

            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-xs font-mono text-muted-foreground">Delay de Entrega</Label>
                <span className="text-xs font-mono text-primary">{delay[0]} horas</span>
              </div>
              <Slider value={delay} onValueChange={setDelay} min={1} max={72} step={1} disabled={status !== "idle"} />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">1h</span>
                <span className="text-xs text-muted-foreground">72h</span>
              </div>
            </div>

            {parsedAmount > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa ({quote.ratePercent}%)</span>
                  <span className="font-mono">{formatCryptoAmount(quote.fee)} {currency}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-muted-foreground">Você Recebe</span>
                  <span className="font-mono text-primary">{formatCryptoAmount(quote.net)} {currency}</span>
                </div>
                {outputs.length > 1 && (
                  <div className="border-t border-border pt-2 space-y-1">
                    <p className="text-xs text-muted-foreground">Distribuição:</p>
                    {outputs.map((o, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="font-mono truncate max-w-[180px]">{o.address || `Endereço ${i + 1}`}</span>
                        <span className="font-mono text-primary">
                          {formatCryptoAmount(quote.net * o.percentage / 100)} {currency} ({o.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="glass-card p-3 border-warning/30">
              <p className="text-xs text-muted-foreground">
                <span className="text-warning font-mono">⚠ AVISO:</span> Este é um serviço simulado. Nenhuma criptomoeda real é mixada.
              </p>
            </div>

            <Button variant="hero" className="w-full" onClick={handleSubmit} disabled={status !== "idle"}>
              {status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === "idle" && "Criar Sessão de Mix"}
              {status === "submitting" && "Processando..."}
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Mixing;
