import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import OutputAddresses, { type OutputEntry } from "@/components/mixing/OutputAddresses";
import MixingComplete from "@/components/mixing/MixingComplete";

type MixStatus = "idle" | "submitting" | "processing" | "complete";

const Mixing = () => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("BTC");
  const [outputs, setOutputs] = useState<OutputEntry[]>([{ address: "", percentage: 100 }]);
  const [delay, setDelay] = useState([6]);
  const [status, setStatus] = useState<MixStatus>("idle");
  const [sessionId, setSessionId] = useState("");

  const fee = amount ? (parseFloat(amount) * 0.025).toFixed(6) : "0";
  const netAmount = amount ? (parseFloat(amount) - parseFloat(fee)).toFixed(6) : "0";

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Valor inválido", description: "Insira um valor válido.", variant: "destructive" });
      return;
    }
    if (outputs.some((o) => !o.address.trim())) {
      toast({ title: "Endereço ausente", description: "Preencha todos os endereços de destino.", variant: "destructive" });
      return;
    }
    const totalPct = outputs.reduce((s, o) => s + o.percentage, 0);
    if (outputs.length > 1 && totalPct !== 100) {
      toast({ title: "Distribuição inválida", description: `O total deve ser 100% (atual: ${totalPct}%).`, variant: "destructive" });
      return;
    }

    setStatus("submitting");
    await new Promise((r) => setTimeout(r, 1500));
    setStatus("processing");
    await new Promise((r) => setTimeout(r, 2500));

    const id = `MIX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setSessionId(id);
    setStatus("complete");
    toast({ title: "Sessão de Mix Criada", description: `Sessão ${id} em processamento.` });
  };

  const handleReset = () => {
    setStatus("idle");
    setAmount("");
    setOutputs([{ address: "", percentage: 100 }]);
    setSessionId("");
  };

  if (status === "complete") {
    return (
      <Layout>
        <MixingComplete
          sessionId={sessionId}
          amount={amount}
          currency={currency}
          fee={fee}
          netAmount={netAmount}
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
                <Select value={currency} onValueChange={setCurrency} disabled={status !== "idle"}>
                  <SelectTrigger className="mt-1 font-mono bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC">BTC</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="LTC">LTC</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <OutputAddresses
              outputs={outputs}
              onChange={setOutputs}
              disabled={status !== "idle"}
            />

            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-xs font-mono text-muted-foreground">Delay de Entrega</Label>
                <span className="text-xs font-mono text-primary">{delay[0]} horas</span>
              </div>
              <Slider
                value={delay}
                onValueChange={setDelay}
                min={1}
                max={72}
                step={1}
                disabled={status !== "idle"}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">1h</span>
                <span className="text-xs text-muted-foreground">72h</span>
              </div>
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa (2.5%)</span>
                  <span className="font-mono">{fee} {currency}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-muted-foreground">Você Recebe</span>
                  <span className="font-mono text-primary">{netAmount} {currency}</span>
                </div>
                {outputs.length > 1 && (
                  <div className="border-t border-border pt-2 space-y-1">
                    <p className="text-xs text-muted-foreground">Distribuição:</p>
                    {outputs.map((o, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="font-mono truncate max-w-[180px]">{o.address || `Endereço ${i + 1}`}</span>
                        <span className="font-mono text-primary">
                          {(parseFloat(netAmount) * o.percentage / 100).toFixed(6)} {currency} ({o.percentage}%)
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

            <Button
              variant="hero"
              className="w-full"
              onClick={handleSubmit}
              disabled={status !== "idle"}
            >
              {status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === "processing" && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === "idle" && "Criar Sessão de Mix"}
              {status === "submitting" && "Validando..."}
              {status === "processing" && "Processando..."}
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Mixing;
