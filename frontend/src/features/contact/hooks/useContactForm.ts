import { useState } from "react";
import { contactSchema, type ContactFormData } from "@/domain/contact/contactSchema";
import { supabase } from "@/integrations/supabase/client";

export function useContactForm() {
  const [form, setForm] = useState<ContactFormData>({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = (field: keyof ContactFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async () => {
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ContactFormData;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return { ok: false };
    }

    setSubmitError(null);
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
      return { ok: true };
    } catch {
      setSubmitError("Não foi possível enviar a mensagem. Tente novamente.");
      return { ok: false };
    } finally {
      setSending(false);
    }
  };

  return { form, errors, sending, sent, submitError, update, submit };
}
