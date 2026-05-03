import Layout from "@/shared/layout/Layout";
import { HOW_STEPS } from "../content/steps";
import { Notice } from "@/shared/ui/Notice";
import { DISCLAIMERS } from "@/shared/content";

const HowItWorksPage = () => (
  <Layout>
    <section className="py-20" aria-labelledby="how-it-works-title">
      <div className="container max-w-4xl">
        <h1 id="how-it-works-title" className="text-4xl font-bold mb-4 text-center">
          Como <span className="text-gradient-green">Funciona</span>
        </h1>
        <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
          Visão conceitual das etapas envolvidas em uma sessão. Esta página descreve apenas o fluxo
          — instruções operacionais detalhadas estão na própria tela de criação de sessão.
        </p>

        <ol className="space-y-6" aria-label="Etapas do fluxo de sessão">
          {HOW_STEPS.map((step) => (
            <li key={step.number} className="glass-card p-6 flex gap-6 items-start">
              <div aria-hidden="true" className="flex-shrink-0 h-12 w-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center font-mono text-primary font-bold">
                {step.number}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <step.icon aria-hidden="true" className="h-4 w-4 text-primary" />
                  <h2 className="font-mono font-semibold text-lg">{step.title}</h2>
                </div>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

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

export default HowItWorksPage;
