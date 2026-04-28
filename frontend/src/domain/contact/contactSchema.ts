import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Máximo 100 caracteres"),
  email: z.string().trim().email("Email inválido").max(255, "Máximo 255 caracteres"),
  subject: z.string().trim().max(200, "Máximo 200 caracteres").optional().or(z.literal("")),
  message: z.string().trim().min(1, "Mensagem é obrigatória").max(2000, "Máximo 2000 caracteres"),
});

export type ContactFormData = z.infer<typeof contactSchema>;
