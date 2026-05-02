/**
 * Contact-requests HTTP schemas (Zod).
 */
import { z } from 'zod';

export const SubmitContactRequestBodySchema = z
  .object({
    name: z.string().trim().min(1, 'name is required').max(200),
    email: z.string().trim().email('email must be a valid email address').max(320),
    subject: z.string().trim().max(200).optional().nullable(),
    message: z.string().trim().min(1, 'message is required').max(5000),
  })
  .strict();

export type SubmitContactRequestBody = z.infer<typeof SubmitContactRequestBodySchema>;

export const ContactRequestDtoSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['received', 'processed', 'archived']),
  createdAt: z.string(),
});
export type ContactRequestDto = z.infer<typeof ContactRequestDtoSchema>;

export const ContactRequestEnvelopeSchema = z.object({
  request: ContactRequestDtoSchema,
});
export type ContactRequestEnvelope = z.infer<typeof ContactRequestEnvelopeSchema>;
