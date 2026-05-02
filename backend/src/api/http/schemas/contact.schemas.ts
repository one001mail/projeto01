/**
 * Contact HTTP schemas (Zod).
 *
 * Strict body validation; the route never echoes the submitted message
 * back to the client and the audit-log middleware redacts the email and
 * message fields before persistence.
 */
import { z } from 'zod';
import { IsoTimestampSchema, UuidSchema } from './common.schemas.js';

export const SubmitContactBodySchema = z
  .object({
    name: z.string().trim().min(1, 'name is required').max(200),
    email: z.string().trim().email('email must be a valid email address').max(320),
    subject: z.string().trim().max(200).optional().nullable(),
    message: z.string().trim().min(1, 'message is required').max(5000),
  })
  .strict();
export type SubmitContactBody = z.infer<typeof SubmitContactBodySchema>;

export const ContactStatusSchema = z.enum(['received', 'processed', 'archived']);
export type ContactStatus = z.infer<typeof ContactStatusSchema>;

export const ContactReceiptDtoSchema = z.object({
  id: UuidSchema,
  status: ContactStatusSchema,
  createdAt: IsoTimestampSchema,
});
export type ContactReceiptDto = z.infer<typeof ContactReceiptDtoSchema>;
