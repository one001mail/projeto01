import { supabase } from "@/integrations/supabase/client";
import type { ContactFormData } from "@/domain/contact/contactSchema";

export async function submitContactRequest(data: ContactFormData): Promise<void> {
  const { error } = await supabase.from("contact_requests").insert({
    name: data.name,
    email: data.email,
    subject: data.subject || null,
    message: data.message,
  });
  if (error) throw error;
}
