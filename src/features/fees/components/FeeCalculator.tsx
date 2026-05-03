import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, ArrowRight } from "lucide-react";
import type { Currency } from "@/domain/types";
import { CURRENCIES, CURRENCY_LABELS } from "@/domain/types";
import { formatCryptoAmount } from "@/domain/pricing/getQuote";
import { useFeeCalculator } from "../hooks/useFeeCalculator";
import { FEES_COPY } from "../content/copy";

const FeeCalculator = () => {
  const { currency, amount, range, quote, setCurrency, setAmount } = useFeeCalculator("BTC");

  return (
    <section className="glass-card p-6 md:p-8 space-y-6" aria-labelledby="fee-calc-heading">
      <div className="flex items-center gap-3 mb-2">
        <div aria-hidden="true" className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 id="fee-calc-heading" className="font-mono font-semibold text-lg">{FEES_COPY.calc.heading}</h3>
          <p className="text-xs text-muted-foreground">{FEES_COPY.calc.sub}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fee-currency" className="font-mono text-xs text-muted-foreground">{FEES_COPY.calc.currencyLabel}</Label>
          <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
            <SelectTrigger id="fee-currency" className="bg-muted/30 border-border font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>{CURRENCY_LABELS[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="fee-amount" className="font-mono text-xs text-muted-foreground">{FEES_COPY.calc.amountLabel(currency)}</Label>
          <Input
            id="fee-amount"
            type="number"
            inputMode="decimal"
            min={range.min}
            max={range.max}
            step={range.step}
            value={amount}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!Number.isNaN(v)) setAmount(v);
            }}
            className="bg-muted/30 border-border font-mono text-lg"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-xs font-mono text-muted-foreground">
          <span>{range.min} {currency}</span>
          <span>{range.max} {currency}</span>
        </div>
        <Slider
          value={[amount]}
          min={range.min}
          max={range.max}
          step={range.step}
          onValueChange={([v]) => setAmount(v)}
          aria-label={`Valor em ${currency}`}
        />
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-5 space-y-4" aria-live="polite">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{FEES_COPY.calc.resultHeading}</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ResultCard label={FEES_COPY.calc.rate} value={`${quote.ratePercent}%`} sub={`min: ${formatCryptoAmount(quote.minFee)} ${currency}`} />
          <ResultCard label={FEES_COPY.calc.fee} value={`${formatCryptoAmount(quote.fee)} ${currency}`} highlight />
          <ResultCard label={FEES_COPY.calc.net} value={`${formatCryptoAmount(quote.net)} ${currency}`} />
        </div>
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 text-sm font-mono">
            <span className="text-muted-foreground">{formatCryptoAmount(amount)} {currency}</span>
            <ArrowRight aria-hidden="true" className="h-3 w-3 text-muted-foreground" />
            <span className="text-destructive">-{formatCryptoAmount(quote.fee)} {currency}</span>
            <ArrowRight aria-hidden="true" className="h-3 w-3 text-muted-foreground" />
            <span className="text-primary font-semibold">{formatCryptoAmount(quote.net)} {currency}</span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((quote.net / amount) * 100)}
            aria-label="Proporção de valor líquido"
            className="w-full h-2 rounded-full bg-muted overflow-hidden flex"
          >
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(quote.net / amount) * 100}%` }} />
            <div className="h-full bg-destructive/60 transition-all duration-300" style={{ width: `${(quote.fee / amount) * 100}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>Líquido ({((quote.net / amount) * 100).toFixed(1)}%)</span>
            <span>Taxa ({((quote.fee / amount) * 100).toFixed(1)}%)</span>
          </div>
        </div>
      </div>
    </section>
  );
};

const ResultCard = ({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) => (
  <div className={`rounded-md border p-3 text-center ${highlight ? "border-primary/40 bg-primary/5" : "border-border bg-muted/10"}`}>
    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{label}</div>
    <div className={`font-mono text-lg font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</div>
    {sub && <div className="text-[10px] font-mono text-muted-foreground mt-1">{sub}</div>}
  </div>
);

export default FeeCalculator;
