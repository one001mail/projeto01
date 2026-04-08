import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, ArrowRight } from "lucide-react";

const TIERS: Record<string, { min: number; max: number; rate: number; minFee: number }[]> = {
  BTC: [
    { min: 0.001, max: 0.1, rate: 0.03, minFee: 0.00003 },
    { min: 0.1, max: 1, rate: 0.025, minFee: 0.0025 },
    { min: 1, max: 10, rate: 0.02, minFee: 0.02 },
    { min: 10, max: 100, rate: 0.015, minFee: 0.15 },
  ],
  ETH: [
    { min: 0.01, max: 1, rate: 0.03, minFee: 0.0003 },
    { min: 1, max: 10, rate: 0.025, minFee: 0.025 },
    { min: 10, max: 100, rate: 0.02, minFee: 0.2 },
    { min: 100, max: 1000, rate: 0.015, minFee: 1.5 },
  ],
  LTC: [
    { min: 0.1, max: 10, rate: 0.03, minFee: 0.003 },
    { min: 10, max: 100, rate: 0.025, minFee: 0.25 },
    { min: 100, max: 1000, rate: 0.02, minFee: 2 },
    { min: 1000, max: 10000, rate: 0.015, minFee: 15 },
  ],
  USDT: [
    { min: 10, max: 1000, rate: 0.03, minFee: 0.3 },
    { min: 1000, max: 10000, rate: 0.025, minFee: 25 },
    { min: 10000, max: 100000, rate: 0.02, minFee: 200 },
    { min: 100000, max: 1000000, rate: 0.015, minFee: 1500 },
  ],
  USDC: [
    { min: 10, max: 1000, rate: 0.03, minFee: 0.3 },
    { min: 1000, max: 10000, rate: 0.025, minFee: 25 },
    { min: 10000, max: 100000, rate: 0.02, minFee: 200 },
    { min: 100000, max: 1000000, rate: 0.015, minFee: 1500 },
  ],
};

const RANGES: Record<string, { min: number; max: number; step: number }> = {
  BTC: { min: 0.001, max: 50, step: 0.001 },
  ETH: { min: 0.01, max: 500, step: 0.01 },
  LTC: { min: 0.1, max: 5000, step: 0.1 },
  USDT: { min: 10, max: 500000, step: 1 },
  USDC: { min: 10, max: 500000, step: 1 },
};

const FeeCalculator = () => {
  const [currency, setCurrency] = useState("BTC");
  const [amount, setAmount] = useState(0.5);

  const range = RANGES[currency];

  const result = useMemo(() => {
    const tiers = TIERS[currency];
    const tier = tiers.find((t) => amount >= t.min && amount < t.max) ?? tiers[tiers.length - 1];
    const calculatedFee = amount * tier.rate;
    const fee = Math.max(calculatedFee, tier.minFee);
    const net = Math.max(amount - fee, 0);
    return {
      rate: tier.rate,
      ratePercent: (tier.rate * 100).toFixed(1),
      fee,
      net,
      minFee: tier.minFee,
    };
  }, [currency, amount]);

  const formatNum = (n: number) => {
    if (n < 0.0001) return n.toExponential(2);
    if (n < 1) return n.toFixed(6);
    if (n < 100) return n.toFixed(4);
    return n.toFixed(2);
  };

  return (
    <div className="glass-card p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Calculator className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-mono font-semibold text-lg">Calculadora de Taxas</h3>
          <p className="text-xs text-muted-foreground">Simule o custo da sua operação</p>
        </div>
      </div>

      {/* Currency + Amount input */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="font-mono text-xs text-muted-foreground">Moeda</Label>
          <Select value={currency} onValueChange={(v) => { setCurrency(v); setAmount(RANGES[v].min * 10); }}>
            <SelectTrigger className="bg-muted/30 border-border font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BTC">BTC — Bitcoin</SelectItem>
              <SelectItem value="ETH">ETH — Ethereum</SelectItem>
              <SelectItem value="LTC">LTC — Litecoin</SelectItem>
              <SelectItem value="USDT">USDT — Tether</SelectItem>
              <SelectItem value="USDC">USDC — USD Coin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label className="font-mono text-xs text-muted-foreground">Valor ({currency})</Label>
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

      {/* Slider */}
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
        />
      </div>

      {/* Results */}
      <div className="rounded-lg border border-border bg-muted/20 p-5 space-y-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Resultado</div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ResultCard label="Taxa Aplicada" value={`${result.ratePercent}%`} sub={`min: ${formatNum(result.minFee)} ${currency}`} />
          <ResultCard label="Valor da Taxa" value={`${formatNum(result.fee)} ${currency}`} highlight />
          <ResultCard label="Você Recebe" value={`${formatNum(result.net)} ${currency}`} />
        </div>

        {/* Visual breakdown */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 text-sm font-mono">
            <span className="text-muted-foreground">{formatNum(amount)} {currency}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-destructive">-{formatNum(result.fee)} {currency}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-primary font-semibold">{formatNum(result.net)} {currency}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(result.net / amount) * 100}%` }}
            />
            <div
              className="h-full bg-destructive/60 transition-all duration-300"
              style={{ width: `${(result.fee / amount) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>Líquido ({((result.net / amount) * 100).toFixed(1)}%)</span>
            <span>Taxa ({((result.fee / amount) * 100).toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center font-mono">
        <span className="text-warning">⚠ SIMULADO:</span> Valores apenas para demonstração. Nenhuma cobrança real é aplicada.
      </p>
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
