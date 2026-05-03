import Layout from "@/shared/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, Mail } from "lucide-react";
import { useContactForm } from "../hooks/useContactForm";
import { FieldError } from "@/shared/ui/FieldError";
import { Notice } from "@/shared/ui/Notice";
import { CONTACT_COPY } from "../content/copy";

const ContactPage = () => {
  const { form, errors, sending, sent, submitError, update, submit } = useContactForm();

  if (sent) {
    return (
      <Layout>
        <section className="py-20" aria-labelledby="contact-success-title">
          <div className="container max-w-lg">
            <div className="glass-card p-8 text-center" role="status">
              <CheckCircle aria-hidden="true" className="h-12 w-12 text-primary mx-auto mb-4" />
              <h1 id="contact-success-title" className="text-2xl font-bold mb-2">{CONTACT_COPY.success.title}</h1>
              <p className="text-muted-foreground text-sm">
                {CONTACT_COPY.success.subtitle}
              </p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-20" aria-labelledby="contact-title">
        <div className="container max-w-lg">
          <h1 id="contact-title" className="text-3xl font-bold mb-2 text-center">
            <span className="text-gradient-green">{CONTACT_COPY.title}</span>
          </h1>
          <p className="text-muted-foreground text-center mb-6 text-sm">
            {CONTACT_COPY.subtitle}
          </p>

          <div className="mb-6">
            <Notice tone="info">{CONTACT_COPY.privacy}</Notice>
          </div>

          <form
            noValidate
            onSubmit={(e) => { e.preventDefault(); submit(); }}
            className="glass-card p-6 space-y-5"
            aria-busy={sending}
          >
            <div>
              <Label htmlFor="contact-name" className="text-xs font-mono text-muted-foreground">{CONTACT_COPY.fields.name} *</Label>
              <Input
                id="contact-name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="mt-1 bg-muted border-border"
                placeholder={CONTACT_COPY.fields.namePlaceholder}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? "contact-name-error" : undefined}
                autoComplete="name"
              />
              <FieldError message={errors.name} />
            </div>
            <div>
              <Label htmlFor="contact-email" className="text-xs font-mono text-muted-foreground">{CONTACT_COPY.fields.email} *</Label>
              <Input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="mt-1 bg-muted border-border"
                placeholder={CONTACT_COPY.fields.emailPlaceholder}
                aria-invalid={errors.email ? true : undefined}
                autoComplete="email"
              />
              <FieldError message={errors.email} />
            </div>
            <div>
              <Label htmlFor="contact-subject" className="text-xs font-mono text-muted-foreground">{CONTACT_COPY.fields.subject}</Label>
              <Input
                id="contact-subject"
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
                className="mt-1 bg-muted border-border"
                placeholder={CONTACT_COPY.fields.subjectPlaceholder}
              />
            </div>
            <div>
              <Label htmlFor="contact-message" className="text-xs font-mono text-muted-foreground">{CONTACT_COPY.fields.message} *</Label>
              <Textarea
                id="contact-message"
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                className="mt-1 bg-muted border-border min-h-[120px]"
                placeholder={CONTACT_COPY.fields.messagePlaceholder}
                aria-invalid={errors.message ? true : undefined}
              />
              <FieldError message={errors.message} />
            </div>

            {submitError && <Notice tone="danger">{submitError}</Notice>}

            <Button type="submit" variant="hero" className="w-full" disabled={sending}>
              {sending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Mail aria-hidden="true" className="h-4 w-4" />}
              {sending ? CONTACT_COPY.submitSending : CONTACT_COPY.submitIdle}
            </Button>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default ContactPage;
