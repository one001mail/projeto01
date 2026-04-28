import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import type { MixOutput, Currency } from "@/domain/types";

interface MixingCompleteProps {
  sessionId: string;
  amount: string;
  currency: Currency;
  fee: string;
  netAmount: string;
  ratePercent: string;
  delay: number;
  outputs: MixOutput[];
  depositAddress?: string | null;
  onReset: () => void;
}

const MixingComplete = ({ sessionId, amount, currency, fee, netAmount, ratePercent, delay, outputs, depositAddress, onReset }: MixingCompleteProps) => {
  const { toast } = useToast();

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    toast({ title: "Copiado", description: "ID da sessão copiado." });
  };

  const copyDepositAddress = () => {
    if (depositAddress) {
      navigator.clipboard.writeText(depositAddress);
      toast({ title: "Copiado", description: "Endereço de depósito copiado." });
    }
  };

  return (
    <section className="py-20">
      <div className="container max-w-lg">
        <div className="glass-card p-8 text-center">
          <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sessão de Mix Criada</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Envie os fundos para o endereço de depósito abaixo para iniciar o mixing.
          </p>

          {depositAddress && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Wallet className="h-5 w-5 text-primary" />
                <p className="text-xs text-primary font-mono font-semibold">ENDEREÇO DE DEPÓSITO ({currency})</p>
              </div>
              <div className="flex justify-center mb-3">
                <div className="bg-white p-3 rounded-lg">
                  <QRCodeSVG value={depositAddress} size={160} />
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <code className="text-primary font-mono text-sm break-all">{depositAddress}</code>
                <button onClick={copyDepositAddress} className="text-muted-foreground hover:text-primary flex-shrink-0">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Envie exatamente <span className="font-mono text-primary font-semibold">{amount} {currency}</span> para este endereço.
              </p>
            </div>
          )}

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
              <span className="text-muted-foreground">Taxa ({ratePercent}%)</span>
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

          {!depositAddress && (
            <div className="glass-card p-3 border-warning/30 mb-6">
              <p className="text-xs text-muted-foreground">
                <span className="text-warning font-mono">⚠ AVISO</span> — Não foi possível gerar o endereço de depósito. Entre em contato com o suporte.
              </p>
            </div>
          )}

          <Button variant="hero" onClick={onReset}>
            Nova Sessão de Mix
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MixingComplete;
