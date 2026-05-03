/**
 * Contact feature API surface. All network traffic goes through the shared
 * httpClient — no direct Supabase or fetch calls.
 */
import { httpClient, endpoints } from "@/shared/api";
import type { ContactFormData } from "@/domain/contact/contactSchema";

export async function submitContactRequest(
  data: ContactFormData,
): Promise<void> {
  await httpClient.post<unknown>(endpoints.contactRequests.create(), {
    name: data.name,
    email: data.email,
    subject: data.subject ? data.subject : null,
    message: data.message,
  });
}
