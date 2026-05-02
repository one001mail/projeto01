/**
 * Learning-sessions HTTP schemas (Zod).
 *
 * The schemas are the public contract for this module's HTTP surface.
 * Inferred types flow into the controller / presenter so the layer below
 * works against parsed, typed data.
 */
import { z } from 'zod';
import { PUBLIC_CODE_LENGTH } from '../../domain/public-code.js';

export const CreateLearningSessionBodySchema = z
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

export type CreateLearningSessionBody = z.infer<typeof CreateLearningSessionBodySchema>;

export const LearningSessionParamsSchema = z
  .object({
    publicCode: z
      .string()
      .length(PUBLIC_CODE_LENGTH, `publicCode must be ${PUBLIC_CODE_LENGTH} chars`),
  })
  .strict();

export type LearningSessionParams = z.infer<typeof LearningSessionParamsSchema>;

export const LearningSessionDtoSchema = z.object({
  id: z.string().uuid(),
  publicCode: z.string(),
  status: z.enum(['pending', 'active', 'completed', 'expired']),
  subject: z.string().nullable(),
  inputValue: z.number().nullable(),
  computedResult: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  expiresAt: z.string().nullable(),
});
export type LearningSessionDto = z.infer<typeof LearningSessionDtoSchema>;

export const LearningSessionEnvelopeSchema = z.object({
  session: LearningSessionDtoSchema,
});
export type LearningSessionEnvelope = z.infer<typeof LearningSessionEnvelopeSchema>;
