import Layout from "@/components/layout/Layout";
import FeeCalculator from "@/components/fees/FeeCalculator";
import { getFeeTableRows } from "@/domain/pricing/pricingRules";
import { Notice } from "@/shared/ui/Notice";

const tiers = getFeeTableRows();

const Fees = () => (
  <Layout>
    <section className="py-20">
      <div className="container max-w-3xl">
        <h1 className="text-4xl font-bold mb-4 text-center">
          Tabela de <span className="text-gradient-green">Taxas</span>
        </h1>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          A taxa varia por faixa de valor. Não há cobranças adicionais ocultas.
        </p>

        <div className="mb-12">
          <FeeCalculator />
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-left text-xs font-mono text-muted-foreground uppercase tracking-wider">Faixa de Valor</th>
                <th className="px-6 py-4 text-left text-xs font-mono text-muted-foreground uppercase tracking-wider">Taxa</th>
                <th className="px-6 py-4 text-left text-xs font-mono text-muted-foreground uppercase tracking-wider">Taxa Mínima</th>
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
            <div className="mt-2 font-mono text-primary">taxa = max(valor × percentual, taxa_minima)</div>
          </Notice>
        </div>
      </div>
    </section>
  </Layout>
);

export default Fees;
