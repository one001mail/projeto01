import Layout from "@/shared/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useSessionLookup } from "../hooks/useSessionLookup";
import { MIXING_COPY } from "../content/copy";
import { formatCryptoAmount } from "@/domain/pricing/getQuote";
import { Notice } from "@/shared/ui/Notice";

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: { label: "Pendente", icon: Clock, className: "text-warning" },
  processing: { label: "Processando", icon: Loader2, className: "text-primary" },
  complete: { label: "Concluído", icon: CheckCircle2, className: "text-primary" },
  failed: { label: "Falhou", icon: XCircle, className: "text-destructive" },
  expired: { label: "Expirado", icon: AlertCircle, className: "text-muted-foreground" },
};

const SessionLookupPage = () => {
  const { code, setCode, loading, error, session, search } = useSessionLookup();
  const statusInfo = session ? STATUS_CONFIG[session.status] || STATUS_CONFIG.pending : null;
  const StatusIcon = statusInfo?.icon || Clock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search();
  };

  return (
    <Layout>
      <section className="py-20" aria-labelledby="lookup-title">
        <div className="container max-w-lg">
          <h1 id="lookup-title" className="text-3xl font-bold mb-2 text-center">
            {MIXING_COPY.lookup.title} <span className="text-gradient-green">{MIXING_COPY.lookup.titleAccent}</span>
          </h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            {MIXING_COPY.lookup.subtitle}
          </p>

          <form onSubmit={handleSubmit} noValidate className="glass-card p-6 space-y-4" aria-busy={loading}>
            <div>
              <Label htmlFor="session-code" className="text-xs font-mono text-muted-foreground">
                {MIXING_COPY.lookup.codeLabel}
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="session-code"
                  placeholder={MIXING_COPY.lookup.codePlaceholder}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="font-mono bg-muted border-border"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "session-code-error" : undefined}
                />
                <Button type="submit" disabled={loading} variant="hero" className="shrink-0" aria-label="Consultar sessão">
                  {loading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Search aria-hidden="true" className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <div id="session-code-error">
                <Notice tone="danger">{error}</Notice>
              </div>
            )}

            {session && statusInfo && (
              <div className="space-y-4 pt-4 border-t border-border" aria-live="polite">
                <div className="flex items-center gap-2">
                  <StatusIcon aria-hidden="true" className={`h-5 w-5 ${statusInfo.className} ${session.status === "processing" ? "animate-spin" : ""}`} />
                  <span className={`font-mono font-semibold ${statusInfo.className}`}>{statusInfo.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto font-mono">{session.session_code}</span>
                </div>

                <dl className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <Row label="Moeda" value={session.currency} />
                  <Row label="Valor" value={`${formatCryptoAmount(session.amount)} ${session.currency}`} />
                  <Row label="Taxa" value={`${formatCryptoAmount(session.fee_amount)} ${session.currency} (${(session.fee_rate * 100).toFixed(1)}%)`} />
                  <Row label="Valor líquido" value={`${formatCryptoAmount(session.net_amount)} ${session.currency}`} highlight />
                  <Row label="Atraso" value={`${session.delay_hours}h`} />
                  <Row label="Criado em" value={new Date(session.created_at).toLocaleString("pt-BR")} />
                </dl>

                {session.outputs?.length > 0 && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="text-xs text-muted-foreground font-mono mb-2">Endereços de destino:</p>
                    <ul>
                      {session.outputs.map((o, i) => (
                        <li key={i} className="flex justify-between text-xs">
                          <span className="font-mono truncate max-w-[200px]">{o.address}</span>
                          <span className="font-mono text-primary">{o.percentage}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </section>
    </Layout>
  );
};

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex justify-between">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className={`font-mono ${highlight ? "text-primary font-semibold" : ""}`}>{value}</dd>
  </div>
);

export default SessionLookupPage;
