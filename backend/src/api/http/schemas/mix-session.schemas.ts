/**
 * Mix-session HTTP schemas (Zod).
 *
 * Mix-sessions are the public, sandbox-only endpoint for educational
 * demonstrations of session lifecycles. They DO NOT submit transactions,
 * touch chains, or promise anonymity. The DTO exposed to clients always
 * carries a `sandboxNotice` block.
 */
import { z } from 'zod';
import { IsoTimestampSchema, SandboxNoticeSchema, UuidSchema } from './common.schemas.js';

export const MixSessionStatusSchema = z.enum(['pending', 'active', 'completed', 'expired']);
export type MixSessionStatus = z.infer<typeof MixSessionStatusSchema>;

/**
 * Public mix-session identifier surfaced in the URL. Internally backed by
 * the `learning-sessions.publicCode` value object (10 chars from a 31-char
 * alphabet without 0/O/1/I/L). Validation is structural only here; the
 * use case applies the canonical `isValidPublicCode` check.
 */
export const MixSessionPublicIdSchema = z
  .string()
  .trim()
  .min(6, 'mix-session id is too short')
  .max(64, 'mix-session id is too long');

export const CreateMixSessionBodySchema = z
  .object({
    subject: z
      .string()
      .trim()
      .max(200, 'subject must not exceed 200 characters')
      .optional()
      .nullable(),
    inputValue: z
      .number()
      .finite()
      .nonnegative('inputValue must be non-negative')
      .optional()
      .nullable(),
    expiresInSeconds: z
      .number()
      .int('expiresInSeconds must be an integer')
      .positive('expiresInSeconds must be positive')
      .max(60 * 60 * 24 * 30, 'expiresInSeconds must be <= 30 days')
      .optional()
      .nullable(),
  })
  .strict();
export type CreateMixSessionBody = z.infer<typeof CreateMixSessionBodySchema>;

export const GetMixSessionParamsSchema = z.object({ id: MixSessionPublicIdSchema }).strict();
export type GetMixSessionParams = z.infer<typeof GetMixSessionParamsSchema>;

export const MixSessionDtoSchema = z.object({
  id: UuidSchema,
  publicId: z.string(),
  status: MixSessionStatusSchema,
  subject: z.string().nullable(),
  inputValue: z.number().nullable(),
  computedResult: z.number().nullable(),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
  expiresAt: IsoTimestampSchema.nullable(),
  sandboxNotice: SandboxNoticeSchema,
});
export type MixSessionDto = z.infer<typeof MixSessionDtoSchema>;
