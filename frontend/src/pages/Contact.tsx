import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, Mail } from "lucide-react";
import { useContactForm } from "@/features/contact/hooks/useContactForm";
import { FieldError } from "@/shared/ui/FieldError";
import { Notice } from "@/shared/ui/Notice";

const Contact = () => {
  const { form, errors, sending, sent, submitError, update, submit } = useContactForm();

  if (sent) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container max-w-lg">
            <div className="glass-card p-8 text-center">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Mensagem enviada</h2>
              <p className="text-muted-foreground text-sm">
                Recebemos sua mensagem e responderemos em breve.
              </p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-20">
        <div className="container max-w-lg">
          <h1 className="text-3xl font-bold mb-2 text-center">
            <span className="text-gradient-green">Contato</span>
          </h1>
          <p className="text-muted-foreground text-center mb-6 text-sm">
            Coletamos apenas o essencial para responder sua mensagem.
          </p>

          <div className="mb-6">
            <Notice tone="info">
              Não compartilhamos seus dados com terceiros. As mensagens são usadas apenas para o atendimento.
            </Notice>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); submit(); }}
            className="glass-card p-6 space-y-5"
          >
            <div>
              <Label htmlFor="name" className="text-xs font-mono text-muted-foreground">Nome *</Label>
              <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} className="mt-1 bg-muted border-border" placeholder="Seu nome" />
              <FieldError message={errors.name} />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs font-mono text-muted-foreground">Email *</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="mt-1 bg-muted border-border" placeholder="voce@exemplo.com" />
              <FieldError message={errors.email} />
            </div>
            <div>
              <Label htmlFor="subject" className="text-xs font-mono text-muted-foreground">Assunto</Label>
              <Input id="subject" value={form.subject} onChange={(e) => update("subject", e.target.value)} className="mt-1 bg-muted border-border" placeholder="Opcional" />
            </div>
            <div>
              <Label htmlFor="message" className="text-xs font-mono text-muted-foreground">Mensagem *</Label>
              <Textarea id="message" value={form.message} onChange={(e) => update("message", e.target.value)} className="mt-1 bg-muted border-border min-h-[120px]" placeholder="Como podemos ajudar?" />
              <FieldError message={errors.message} />
            </div>

            {submitError && <Notice tone="danger">{submitError}</Notice>}

            <Button variant="hero" className="w-full" disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {sending ? "Enviando..." : "Enviar mensagem"}
            </Button>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
