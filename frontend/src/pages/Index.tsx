import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { HOME_FEATURES } from "@/features/home/content/features";
import { EnvironmentBadge } from "@/shared/ui/EnvironmentBadge";
import { Notice } from "@/shared/ui/Notice";
import { DISCLAIMERS } from "@/shared/content";

const Index = () => (
  <Layout>
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(142_70%_45%/0.08),transparent_60%)]" />
      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <EnvironmentBadge />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span>Distribuição de Valores Entre</span>
            <br />
            <span className="text-gradient-green">Múltiplos Endereços</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Plataforma educacional que demonstra um fluxo de criação de sessão para
            distribuir valores entre destinos com atraso configurável e cálculo de taxas transparente.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link to="/mixing">
              <Button variant="hero" size="lg" className="gap-2 px-10 h-14">
                Iniciar Sessão <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="outline" size="lg" className="h-14">
                Como Funciona
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>

    <section className="py-16 border-t border-border">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-4">
          Princípios do <span className="text-gradient-green">Projeto</span>
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Cada componente da aplicação foi desenhado para favorecer clareza e reduzir erro do usuário.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOME_FEATURES.map((f) => (
            <div key={f.title} className="glass-card p-6 hover:border-primary/30 transition-colors">
              <f.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-mono font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mt-12 space-y-3">
          <Notice tone="warning" title="Ambiente de Demonstração">
            {DISCLAIMERS.sandbox}
          </Notice>
          <Notice tone="info">{DISCLAIMERS.notFinancialAdvice}</Notice>
        </div>
      </div>
    </section>
  </Layout>
);

export default Index;
