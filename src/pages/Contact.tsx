import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, Mail } from "lucide-react";
import { contactSchema, type ContactFormData } from "@/domain/contact/contactSchema";

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState<ContactFormData>({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const update = (field: keyof ContactFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ContactFormData;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("contact_requests").insert({
        name: result.data.name,
        email: result.data.email,
        subject: result.data.subject || null,
        message: result.data.message,
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "Message sent", description: "We'll get back to you soon." });
    } catch {
      toast({ title: "Error", description: "Failed to send message. Please try again.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Layout>
        <section className="py-20">
          <div className="container max-w-lg">
            <div className="glass-card p-8 text-center">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Message Sent</h2>
              <p className="text-muted-foreground text-sm">
                Thank you for reaching out. We'll respond as soon as possible.
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
            <span className="text-gradient-green">Contact</span> Us
          </h1>
          <p className="text-muted-foreground text-center mb-8 text-sm">
            Have a question or concern? Send us a message.
          </p>

          <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
            <div>
              <Label htmlFor="name" className="text-xs font-mono text-muted-foreground">Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} className="mt-1 bg-muted border-border" placeholder="Your name" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="email" className="text-xs font-mono text-muted-foreground">Email *</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="mt-1 bg-muted border-border" placeholder="you@example.com" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="subject" className="text-xs font-mono text-muted-foreground">Subject</Label>
              <Input id="subject" value={form.subject} onChange={(e) => update("subject", e.target.value)} className="mt-1 bg-muted border-border" placeholder="Optional" />
            </div>
            <div>
              <Label htmlFor="message" className="text-xs font-mono text-muted-foreground">Message *</Label>
              <Textarea id="message" value={form.message} onChange={(e) => update("message", e.target.value)} className="mt-1 bg-muted border-border min-h-[120px]" placeholder="Your message..." />
              {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
            </div>

            <Button variant="hero" className="w-full" disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
