import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OutputAddresses, MixingComplete } from "@/features/mixing/components";
import { useMixingForm } from "@/features/mixing/hooks/useMixingForm";
import type { Currency } from "@/domain/types";
import { CURRENCIES, CURRENCY_LABELS } from "@/domain/types";
import { formatCryptoAmount } from "@/domain/pricing/getQuote";
import { Notice } from "@/shared/ui/Notice";
import { FieldError } from "@/shared/ui/FieldError";
import { DISCLAIMERS, RISK_MESSAGES } from "@/shared/content";

const Mixing = () => {
  const { toast } = useToast();
  const f = useMixingForm();

  const handleSubmit = async () => {
    const result = await f.submit();
    if (!result.ok && result.message) {
      toast({ title: "Não foi possível criar a sessão", description: result.message, variant: "destructive" });
    } else if (result.ok) {
      toast({ title: "Sessão criada", description: `Código ${f.sessionId || "gerado"}.` });
    }
  };

  if (f.status === "complete") {
    const displayFee = f.sessionData ? formatCryptoAmount(f.sessionData.fee_amount) : formatCryptoAmount(f.quote.fee);
    const displayNet = f.sessionData ? formatCryptoAmount(f.sessionData.net_amount) : formatCryptoAmount(f.quote.net);
    const displayRate = f.sessionData ? (f.sessionData.fee_rate * 100).toFixed(1) : f.quote.ratePercent;

    return (
      <Layout>
        <MixingComplete
          sessionId={f.sessionId}
          amount={f.amount}
          currency={f.currency}
          fee={displayFee}
          netAmount={displayNet}
          ratePercent={displayRate}
          delay={f.delay}
          outputs={f.outputs}
          depositAddress={f.sessionData?.deposit_address}
          onReset={f.reset}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-20">
        <div className="container max-w-lg">
          <h1 className="text-3xl font-bold mb-2 text-center">
            Criar <span className="text-gradient-green">Sessão</span>
          </h1>
          <p className="text-muted-foreground text-center mb-6 text-sm">
            Configure os parâmetros da sessão. Todos os campos são obrigatórios.
          </p>

          <div className="mb-6 space-y-3">
            <Notice tone="warning">{DISCLAIMERS.irreversible}</Notice>
          </div>

          <div className="glass-card p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="amount" className="text-xs font-mono text-muted-foreground">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={f.amount}
                  onChange={(e) => f.setAmount(e.target.value)}
                  className="mt-1 font-mono bg-muted border-border"
                  disabled={f.status !== "idle"}
                />
                <FieldError message={f.errors.amount} />
              </div>
              <div>
                <Label className="text-xs font-mono text-muted-foreground">Moeda</Label>
                <Select value={f.currency} onValueChange={(v) => f.setCurrency(v as Currency)} disabled={f.status !== "idle"}>
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

            <OutputAddresses outputs={f.outputs} onChange={f.setOutputs} disabled={f.status !== "idle"} />
            <FieldError message={f.errors["outputs.percentage"]} />

            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-xs font-mono text-muted-foreground">Atraso de Entrega</Label>
                <span className="text-xs font-mono text-primary">{f.delay} horas</span>
              </div>
              <Slider value={[f.delay]} onValueChange={([v]) => f.setDelay(v)} min={1} max={72} step={1} disabled={f.status !== "idle"} />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">1h</span>
                <span className="text-xs text-muted-foreground">72h</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{RISK_MESSAGES.delayExplanation}</p>
            </div>

            {f.parsedAmount > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p className="text-xs font-mono text-muted-foreground uppercase">Pré-visualização do cálculo</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa ({f.quote.ratePercent}%)</span>
                  <span className="font-mono">{formatCryptoAmount(f.quote.fee)} {f.currency}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-muted-foreground">Você recebe</span>
                  <span className="font-mono text-primary">{formatCryptoAmount(f.quote.net)} {f.currency}</span>
                </div>
                {f.outputs.length > 1 && (
                  <div className="border-t border-border pt-2 space-y-1">
                    <p className="text-xs text-muted-foreground">Distribuição prevista:</p>
                    {f.outputs.map((o, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="font-mono truncate max-w-[180px]">{o.address || `Endereço ${i + 1}`}</span>
                        <span className="font-mono text-primary">
                          {formatCryptoAmount(f.quote.net * o.percentage / 100)} {f.currency} ({o.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button variant="hero" className="w-full" onClick={handleSubmit} disabled={f.status !== "idle"}>
              {f.status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
              {f.status === "idle" && "Criar Sessão"}
              {f.status === "submitting" && "Processando..."}
            </Button>

            <p className="text-xs text-muted-foreground text-center">{DISCLAIMERS.dataRetention}</p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Mixing;
