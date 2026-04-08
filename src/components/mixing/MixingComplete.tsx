import { Button } from "@/components/ui/button";
import { CheckCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OutputEntry {
  address: string;
  percentage: number;
}

interface MixingCompleteProps {
  sessionId: string;
  amount: string;
  currency: string;
  fee: string;
  netAmount: string;
  delay: number;
  outputs: OutputEntry[];
  onReset: () => void;
}

const MixingComplete = ({ sessionId, amount, currency, fee, netAmount, delay, outputs, onReset }: MixingCompleteProps) => {
  const { toast } = useToast();

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    toast({ title: "Copiado", description: "ID da sessão copiado." });
  };

  return (
    <section className="py-20">
      <div className="container max-w-lg">
        <div className="glass-card p-8 text-center">
          <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sessão de Mix Criada</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Sua sessão simulada de mixing está sendo processada.
          </p>

          <div className="bg-muted rounded-lg p-4 mb-6">
            <p className="text-xs text-muted-foreground mb-1 font-mono">ID DA SESSÃO</p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-primary font-mono font-semibold">{sessionId}</code>
              <button onClick={copySessionId} className="text-muted-foreground hover:text-primary">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="text-left space-y-2 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor</span>
              <span className="font-mono">{amount} {currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxa (2.5%)</span>
              <span className="font-mono">{fee} {currency}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-muted-foreground">Valor Líquido</span>
              <span className="font-mono text-primary font-semibold">{netAmount} {currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delay</span>
              <span className="font-mono">{delay}h</span>
            </div>
            <div className="border-t border-border pt-2">
              <p className="text-muted-foreground mb-1">Endereços de Destino:</p>
              {outputs.map((o, i) => (
                <div key={i} className="flex justify-between text-xs py-0.5">
                  <span className="font-mono truncate max-w-[200px]">{o.address}</span>
                  <span className="font-mono text-primary">{o.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-3 border-warning/30 mb-6">
            <p className="text-xs text-muted-foreground">
              <span className="text-warning font-mono">⚠ SIMULADO</span> — Nenhuma transação real foi executada.
            </p>
          </div>

          <Button variant="hero" onClick={onReset}>
            Nova Sessão de Mix
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MixingComplete;
