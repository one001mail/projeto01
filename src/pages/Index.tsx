import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, Shuffle, Clock, Lock, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Complete Privacy",
    description: "Break the link between sender and receiver addresses using advanced mixing algorithms.",
  },
  {
    icon: Shuffle,
    title: "Multi-Pool Mixing",
    description: "Your transaction is split and routed through multiple pools for maximum obfuscation.",
  },
  {
    icon: Clock,
    title: "Time-Delayed Output",
    description: "Configurable delays between 1-72 hours to prevent timing analysis attacks.",
  },
  {
    icon: Lock,
    title: "Zero-Log Policy",
    description: "Session data is automatically purged after completion. We keep nothing.",
  },
];

const Index = () => (
  <Layout>
    {/* Hero */}
    <section className="relative overflow-hidden py-24 md:py-36">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(142_70%_45%/0.08),transparent_60%)]" />
      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs font-mono text-primary mb-6 animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-glow" />
            Privacy-First Protocol — Active
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in-delay-1">
            Reclaim Your{" "}
            <span className="text-gradient-green">Financial Privacy</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-delay-2">
            CryptoMix breaks the on-chain link between your transactions using advanced mixing pools, time delays, and multi-address distribution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-3">
            <Link to="/mixing">
              <Button variant="hero" size="lg" className="gap-2">
                Start Mixing <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="hero-outline" size="lg">
                How It Works
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="py-20 border-t border-border">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-4">
          Built for <span className="text-gradient-green">Security</span>
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
          Every aspect of CryptoMix is designed to maximize your transaction privacy.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass-card p-6 hover:border-primary/30 transition-colors group">
              <f.icon className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-mono font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Disclaimer */}
    <section className="py-12 border-t border-border bg-card/30">
      <div className="container">
        <div className="glass-card p-6 border-warning/30">
          <p className="text-xs text-muted-foreground text-center">
            <span className="text-warning font-mono font-semibold">⚠ DISCLAIMER:</span>{" "}
            CryptoMix is a demonstration application for educational purposes. This service simulates cryptocurrency mixing. No real transactions are processed. Users must comply with all applicable local laws and regulations.
          </p>
        </div>
      </div>
    </section>
  </Layout>
);

export default Index;
