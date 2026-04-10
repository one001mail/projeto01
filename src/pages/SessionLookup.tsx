import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { lookupMixSession, type MixSessionResponse } from "@/services/mixingApi";
import { formatCryptoAmount } from "@/domain/pricing/getQuote";

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: "Pendente", icon: Clock, className: "text-yellow-400" },
  processing: { label: "Processando", icon: Loader2, className: "text-blue-400" },
  complete: { label: "Completo", icon: CheckCircle2, className: "text-primary" },
  failed: { label: "Falhou", icon: XCircle, className: "text-destructive" },
  expired: { label: "Expirado", icon: AlertCircle, className: "text-muted-foreground" },
};

const SessionLookup = () => {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<MixSessionResponse | null>(null);

  const handleLookup = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      toast({ title: "Erro", description: "Informe o código da sessão.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setSession(null);

    try {
      const result = await lookupMixSession(trimmed);
      setSession(result);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Sessão não encontrada.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = session ? STATUS_CONFIG[session.status] || STATUS_CONFIG.pending : null;
  const StatusIcon = statusInfo?.icon || Clock;

  return (
    <Layout>
      <section className="py-20">
        <div className="container max-w-lg">
          <h1 className="text-3xl font-bold mb-2 text-center">
            Consultar <span className="text-gradient-green">Sessão</span>
          </h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            Insira o código da sessão para verificar o status do seu mix.
          </p>

          <div className="glass-card p-6 space-y-4">
            <div>
              <Label htmlFor="session-code" className="text-xs font-mono text-muted-foreground">
                Código da Sessão
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="session-code"
                  placeholder="MIX-XXXXXXXX-XXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="font-mono bg-muted border-border"
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                />
                <Button onClick={handleLookup} disabled={loading} variant="hero" className="shrink-0">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {session && statusInfo && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <StatusIcon className={`h-5 w-5 ${statusInfo.className} ${session.status === "processing" ? "animate-spin" : ""}`} />
                  <span className={`font-mono font-semibold ${statusInfo.className}`}>{statusInfo.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto font-mono">{session.session_code}</span>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <Row label="Moeda" value={session.currency} />
                  <Row label="Valor" value={`${formatCryptoAmount(session.amount)} ${session.currency}`} />
                  <Row label="Taxa" value={`${formatCryptoAmount(session.fee_amount)} ${session.currency} (${(session.fee_rate * 100).toFixed(1)}%)`} />
                  <Row label="Valor Líquido" value={`${formatCryptoAmount(session.net_amount)} ${session.currency}`} highlight />
                  <Row label="Delay" value={`${session.delay_hours}h`} />
                  <Row label="Criado em" value={new Date(session.created_at).toLocaleString("pt-BR")} />
                </div>

                {session.outputs && session.outputs.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-xs text-muted-foreground font-mono mb-2">Endereços de Destino:</p>
                    {session.outputs.map((o, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="font-mono truncate max-w-[200px]">{o.address}</span>
                        <span className="font-mono text-primary">{o.percentage}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={`font-mono ${highlight ? "text-primary font-semibold" : ""}`}>{value}</span>
  </div>
);

export default SessionLookup;
