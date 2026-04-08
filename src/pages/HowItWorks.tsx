import Layout from "@/components/layout/Layout";
import { ArrowRight, Shuffle, Clock, CheckCircle, AlertTriangle } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Submit Your Request",
    description: "Enter the amount you want to mix and provide one or more receiving addresses. No account required.",
    icon: ArrowRight,
  },
  {
    number: "02",
    title: "Pool Mixing",
    description: "Your funds enter our mixing pool where they are combined with other transactions and split across multiple routes.",
    icon: Shuffle,
  },
  {
    number: "03",
    title: "Time Delay",
    description: "A configurable time delay (1-72 hours) is applied to prevent timing correlation attacks on the blockchain.",
    icon: Clock,
  },
  {
    number: "04",
    title: "Clean Output",
    description: "Mixed funds are sent to your designated receiving address(es) with no traceable link to the original transaction.",
    icon: CheckCircle,
  },
];

const HowItWorks = () => (
  <Layout>
    <section className="py-20">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-bold mb-4 text-center">
          How <span className="text-gradient-green">Mixing</span> Works
        </h1>
        <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
          CryptoMix uses a multi-pool mixing algorithm to sever the on-chain connection between input and output addresses.
        </p>

        <div className="space-y-8">
          {steps.map((step, i) => (
            <div key={step.number} className="glass-card p-6 flex gap-6 items-start animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center font-mono text-primary font-bold">
                {step.number}
              </div>
              <div>
                <h3 className="font-mono font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 glass-card p-6 border-warning/30">
          <div className="flex gap-3 items-start">
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-mono font-semibold text-sm text-warning mb-1">Important Notice</h4>
              <p className="text-xs text-muted-foreground">
                This is a simulated mixing service for demonstration purposes. No real blockchain transactions are executed. 
                The mixing process described above is a conceptual representation of how privacy-enhancing transaction mixing works.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </Layout>
);

export default HowItWorks;
