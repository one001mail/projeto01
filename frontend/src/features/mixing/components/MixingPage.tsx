import Layout from "@/shared/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import OutputAddresses from "./OutputAddresses";
import MixingComplete from "./MixingComplete";
import { useMixingForm } from "../hooks/useMixingForm";
import { MIXING_COPY } from "../content/copy";
import type { Currency } from "@/domain/types";
import { CURRENCIES, CURRENCY_LABELS } from "@/domain/types";
import { formatCryptoAmount } from "@/domain/pricing/getQuote";
import { Notice } from "@/shared/ui/Notice";
import { FieldError } from "@/shared/ui/FieldError";
import { DISCLAIMERS, RISK_MESSAGES } from "@/shared/content";

const MixingPage = () => {
  const { toast } = useToast();
  const f = useMixingForm();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const result = await f.submit();
    if (!result.ok && result.message) {
      toast({ title: MIXING_COPY.create.errorToastTitle, description: result.message, variant: "destructive" });
    } else if (result.ok) {
      toast({ title: MIXING_COPY.create.successToastTitle, description: `Código ${f.sessionId || "gerado"}.` });
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

  const disabled = f.status !== "idle";

  return (
    <Layout>
      <section className="py-20" aria-labelledby="mixing-page-title">
        <div className="container max-w-lg">
          <h1 id="mixing-page-title" className="text-3xl font-bold mb-2 text-center">
            {MIXING_COPY.create.title} <span className="text-gradient-green">{MIXING_COPY.create.titleAccent}</span>
          </h1>
          <p className="text-muted-foreground text-center mb-6 text-sm">
            {MIXING_COPY.create.subtitle}
          </p>

          <div className="mb-6 space-y-3">
            <Notice tone="warning">{DISCLAIMERS.irreversible}</Notice>
          </div>

          <form onSubmit={handleSubmit} noValidate className="glass-card p-6 space-y-6" aria-busy={f.status === "submitting"}>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="amount" className="text-xs font-mono text-muted-foreground">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={f.amount}
                  onChange={(e) => f.setAmount(e.target.value)}
                  className="mt-1 font-mono bg-muted border-border"
                  disabled={disabled}
                  aria-invalid={f.errors.amount ? true : undefined}
                  aria-describedby={f.errors.amount ? "amount-error" : undefined}
                />
                <FieldError message={f.errors.amount} />
              </div>
              <div>
                <Label htmlFor="currency" className="text-xs font-mono text-muted-foreground">Moeda</Label>
                <Select value={f.currency} onValueChange={(v) => f.setCurrency(v as Currency)} disabled={disabled}>
                  <SelectTrigger id="currency" className="mt-1 font-mono bg-muted border-border">
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

            <OutputAddresses outputs={f.outputs} onChange={f.setOutputs} disabled={disabled} />
            <FieldError message={f.errors["outputs.percentage"]} />

            <div>
              <div className="flex justify-between mb-2">
                <Label htmlFor="delay-slider" className="text-xs font-mono text-muted-foreground">Atraso de Entrega</Label>
                <span className="text-xs font-mono text-primary" aria-live="polite">{f.delay} horas</span>
              </div>
              <Slider
                id="delay-slider"
                value={[f.delay]}
                onValueChange={([v]) => f.setDelay(v)}
                min={1}
                max={72}
                step={1}
                disabled={disabled}
                aria-label="Atraso em horas"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">1h</span>
                <span className="text-xs text-muted-foreground">72h</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{RISK_MESSAGES.delayExplanation}</p>
            </div>

            {f.parsedAmount > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm" aria-live="polite">
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
                          {formatCryptoAmount((f.quote.net * o.percentage) / 100)} {f.currency} ({o.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button type="submit" variant="hero" className="w-full" disabled={disabled}>
              {f.status === "submitting" && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
              {f.status === "idle" && MIXING_COPY.create.submitIdle}
              {f.status === "submitting" && MIXING_COPY.create.submitSubmitting}
            </Button>

            <p className="text-xs text-muted-foreground text-center">{DISCLAIMERS.dataRetention}</p>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default MixingPage;
