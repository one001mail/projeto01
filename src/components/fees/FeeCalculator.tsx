import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, ArrowRight } from "lucide-react";
import type { Currency } from "@/domain/types";
import { CURRENCIES, CURRENCY_LABELS } from "@/domain/types";
import { CURRENCY_RANGES } from "@/domain/pricing/pricingRules";
import { getQuote, formatCryptoAmount } from "@/domain/pricing/getQuote";

const FeeCalculator = () => {
  const [currency, setCurrency] = useState<Currency>("BTC");
  const [amount, setAmount] = useState(0.5);

  const range = CURRENCY_RANGES[currency];
  const result = useMemo(() => getQuote(currency, amount), [currency, amount]);

  return (
    <div className="glass-card p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-mono font-semibold text-lg">Fee Calculator</h3>
          <p className="text-xs text-muted-foreground">Estimate the cost of your operation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="font-mono text-xs text-muted-foreground">Currency</Label>
          <Select value={currency} onValueChange={(v) => { setCurrency(v as Currency); setAmount(CURRENCY_RANGES[v as Currency].min * 10); }}>
            <SelectTrigger className="bg-muted/30 border-border font-mono">
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
          <Label className="font-mono text-xs text-muted-foreground">Amount ({currency})</Label>
          <Input
            type="number"
            min={range.min}
            max={range.max}
            step={range.step}
            value={amount}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) setAmount(Math.min(Math.max(v, range.min), range.max));
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
        <Slider value={[amount]} min={range.min} max={range.max} step={range.step} onValueChange={([v]) => setAmount(v)} />
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-5 space-y-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Result</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ResultCard label="Applied Rate" value={`${result.ratePercent}%`} sub={`min: ${formatCryptoAmount(result.minFee)} ${currency}`} />
          <ResultCard label="Fee Amount" value={`${formatCryptoAmount(result.fee)} ${currency}`} highlight />
          <ResultCard label="You Receive" value={`${formatCryptoAmount(result.net)} ${currency}`} />
        </div>
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 text-sm font-mono">
            <span className="text-muted-foreground">{formatCryptoAmount(amount)} {currency}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-destructive">-{formatCryptoAmount(result.fee)} {currency}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-primary font-semibold">{formatCryptoAmount(result.net)} {currency}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(result.net / amount) * 100}%` }} />
            <div className="h-full bg-destructive/60 transition-all duration-300" style={{ width: `${(result.fee / amount) * 100}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>Net ({((result.net / amount) * 100).toFixed(1)}%)</span>
            <span>Fee ({((result.fee / amount) * 100).toFixed(1)}%)</span>
          </div>
        </div>
      </div>

    </div>
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
