import Layout from "@/components/layout/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "What is cryptocurrency mixing?",
    a: "Cryptocurrency mixing (also called tumbling) is a privacy technique that breaks the link between a sender and receiver by pooling multiple transactions together and redistributing them. This makes it significantly harder to trace transactions on the blockchain.",
  },
  {
    q: "Is this service real?",
    a: "No. CryptoMix is a demonstration/educational application. No real cryptocurrency transactions are processed. All mixing sessions are simulated with artificial delays and mock data.",
  },
  {
    q: "How long does mixing take?",
    a: "In our simulation, you can configure a time delay between 1 and 72 hours. In a real mixing service, delays help prevent timing analysis attacks by ensuring outputs don't correlate temporally with inputs.",
  },
  {
    q: "What currencies are supported?",
    a: "The demo supports BTC, ETH, and LTC selections. In a real implementation, each currency would require its own mixing pool and blockchain integration.",
  },
  {
    q: "Are there minimum amounts?",
    a: "Yes, minimum amounts exist per tier to ensure network transaction fees are covered. See the Fees page for complete tier information.",
  },
  {
    q: "What data do you store?",
    a: "Session metadata (amounts, status, timestamps) is stored in the database for demonstration purposes. In a production privacy service, a strict zero-log policy would apply with automatic data purging.",
  },
  {
    q: "Is mixing legal?",
    a: "The legality of cryptocurrency mixing varies by jurisdiction. Some regions consider it a legitimate privacy tool, while others have restrictions. Users must comply with their local laws. This demo does not constitute legal advice.",
  },
];

const FAQ = () => (
  <Layout>
    <section className="py-20">
      <div className="container max-w-3xl">
        <h1 className="text-4xl font-bold mb-4 text-center">
          Frequently Asked <span className="text-gradient-green">Questions</span>
        </h1>
        <p className="text-muted-foreground text-center mb-12">
          Everything you need to know about CryptoMix.
        </p>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="glass-card px-6 border-border">
              <AccordionTrigger className="font-mono text-sm font-semibold hover:text-primary py-4">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  </Layout>
);

export default FAQ;
