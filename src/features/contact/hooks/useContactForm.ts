import { useState } from "react";
import { contactSchema, type ContactFormData } from "@/domain/contact/contactSchema";
import { submitContactRequest } from "../services/contactApi";
import { CONTACT_COPY } from "../content/copy";

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
      await submitContactRequest(result.data);
      setSent(true);
      return { ok: true };
    } catch {
      setSubmitError(CONTACT_COPY.submitError);
      return { ok: false };
    } finally {
      setSending(false);
    }
  };

  return { form, errors, sending, sent, submitError, update, submit };
}
