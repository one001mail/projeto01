import Layout from "@/shared/layout/Layout";
import FeeCalculator from "./FeeCalculator";
import { getFeeTableRows } from "@/domain/pricing/pricingRules";
import { Notice } from "@/shared/ui/Notice";
import { FEES_COPY } from "../content/copy";

const tiers = getFeeTableRows();

const FeesPage = () => (
  <Layout>
    <section className="py-20" aria-labelledby="fees-title">
      <div className="container max-w-3xl">
        <h1 id="fees-title" className="text-4xl font-bold mb-4 text-center">
          {FEES_COPY.title} <span className="text-gradient-green">{FEES_COPY.titleAccent}</span>
        </h1>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          {FEES_COPY.subtitle}
        </p>

        <div className="mb-12">
          <FeeCalculator />
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <caption className="sr-only">Tabela de taxas por faixa de valor</caption>
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th scope="col" className="px-6 py-4 text-left text-xs font-mono text-muted-foreground uppercase tracking-wider">{FEES_COPY.table.range}</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-mono text-muted-foreground uppercase tracking-wider">{FEES_COPY.table.fee}</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-mono text-muted-foreground uppercase tracking-wider">{FEES_COPY.table.min}</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm">{tier.range}</td>
                  <td className="px-6 py-4 font-mono text-sm text-primary font-semibold">{tier.fee}</td>
                  <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{tier.min}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8">
          <Notice tone="info" title="Como o cálculo é feito">
            A faixa é determinada pelo valor de entrada. A taxa percentual é aplicada sobre esse valor.
            Quando o resultado é menor que a taxa mínima da faixa, prevalece a taxa mínima.
            <div className="mt-2 font-mono text-primary">{FEES_COPY.formula}</div>
          </Notice>
        </div>
      </div>
    </section>
  </Layout>
);

export default FeesPage;
