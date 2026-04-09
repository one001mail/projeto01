import Layout from "@/components/layout/Layout";
import FeeCalculator from "@/components/fees/FeeCalculator";
import { getFeeTableRows } from "@/domain/pricing/pricingRules";

const tiers = getFeeTableRows();

const Fees = () => (
  <Layout>
    <section className="py-20">
      <div className="container max-w-3xl">
        <h1 className="text-4xl font-bold mb-4 text-center">
          Transparent <span className="text-gradient-green">Pricing</span>
        </h1>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Our fees are volume-based and fully transparent. No hidden charges.
        </p>

        <div className="mb-12">
          <FeeCalculator />
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-left text-xs font-mono text-muted-foreground uppercase tracking-wider">Volume Range</th>
                <th className="px-6 py-4 text-left text-xs font-mono text-muted-foreground uppercase tracking-wider">Fee Rate</th>
                <th className="px-6 py-4 text-left text-xs font-mono text-muted-foreground uppercase tracking-wider">Min Fee</th>
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

        <div className="mt-8 space-y-4">
          <div className="glass-card p-5">
            <h3 className="font-mono font-semibold text-sm mb-2">How Fees Are Calculated</h3>
            <p className="text-sm text-muted-foreground">
              The fee percentage is applied to the total input amount. The tier is determined by the input amount.
              A minimum fee applies to ensure network costs are covered. Formula: <code className="text-primary font-mono">fee = max(amount × rate, minFee)</code>
            </p>
          </div>
          <div className="glass-card p-5 border-warning/30">
            <p className="text-xs text-muted-foreground">
              <span className="text-warning font-mono">⚠ SIMULATED:</span> These fees are for demonstration only. No real charges apply.
            </p>
          </div>
        </div>
      </div>
    </section>
  </Layout>
);

export default Fees;
