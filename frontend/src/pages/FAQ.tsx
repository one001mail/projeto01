import Layout from "@/components/layout/Layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQ_ITEMS } from "@/features/faq/content/faqs";

const FAQ = () => (
  <Layout>
    <section className="py-20">
      <div className="container max-w-3xl">
        <h1 className="text-4xl font-bold mb-4 text-center">
          Perguntas <span className="text-gradient-green">Frequentes</span>
        </h1>
        <p className="text-muted-foreground text-center mb-12">
          Esclarecimentos sobre o que é, o que não é e como o projeto opera.
        </p>

        <Accordion type="single" collapsible className="space-y-3">
          {FAQ_ITEMS.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="glass-card px-6 border-border">
              <AccordionTrigger className="font-mono text-sm font-semibold hover:text-primary py-4 text-left">
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
