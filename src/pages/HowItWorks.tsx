import Layout from "@/components/layout/Layout";
import { HOW_STEPS } from "@/features/how-it-works/content/steps";
import { Notice } from "@/shared/ui/Notice";
import { DISCLAIMERS } from "@/shared/content";

const HowItWorks = () => (
  <Layout>
    <section className="py-20">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-bold mb-4 text-center">
          Como <span className="text-gradient-green">Funciona</span>
        </h1>
        <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
          Visão conceitual das etapas envolvidas em uma sessão. Esta página descreve apenas o fluxo
          — instruções operacionais detalhadas estão na própria tela de criação de sessão.
        </p>

        <div className="space-y-6">
          {HOW_STEPS.map((step) => (
            <div key={step.number} className="glass-card p-6 flex gap-6 items-start">
              <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center font-mono text-primary font-bold">
                {step.number}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <step.icon className="h-4 w-4 text-primary" />
                  <h3 className="font-mono font-semibold text-lg">{step.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 space-y-3">
          <Notice tone="warning" title="Operações são irreversíveis">
            {DISCLAIMERS.irreversible}
          </Notice>
          <Notice tone="info" title="Responsabilidade do usuário">
            {DISCLAIMERS.responsibility}
          </Notice>
        </div>
      </div>
    </section>
  </Layout>
);

export default HowItWorks;
