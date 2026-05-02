/**
 * Common Zod schemas shared across the public HTTP surface.
 *
 * Keep this file framework-free: only `zod` is imported. Module-specific
 * schemas live next to their routes.
 */
import { z } from 'zod';

/** UUID v4 — used for resource identifiers persisted by the backend. */
export const UuidSchema = z.string().uuid();

/** ISO-8601 timestamp serialized by the backend (`Date#toISOString`). */
export const IsoTimestampSchema = z.string().datetime({ offset: true });

/**
 * Standard query-string pagination contract used by every list endpoint.
 *
 *   ?limit=50&offset=0
 *
 * Limits are clamped server-side; this schema only enforces the type.
 */
export const PaginationQuerySchema = z
  .object({
    limit: z.coerce.number().int().positive().max(500).optional(),
    offset: z.coerce.number().int().nonnegative().optional(),
  })
  .strict();
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

/** Paginated meta block surfaced by `paginated.presenter.ts`. */
export const PaginationMetaSchema = z.object({
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  count: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

/**
 * Sandbox notice attached to every response that simulates a sensitive
 * operation. Clients MUST surface these to end-users so the educational
 * nature of the preview is unambiguous.
 */
export const SandboxNoticeSchema = z.object({
  simulated: z.literal(true),
  disclaimer: z.string(),
});
export type SandboxNotice = z.infer<typeof SandboxNoticeSchema>;

export const SANDBOX_DISCLAIMER =
  'Educational sandbox response. No real funds are moved, no blockchain transactions are sent, and no anonymity is provided. Data may be reset at any time.';

export function makeSandboxNotice(): SandboxNotice {
  return { simulated: true, disclaimer: SANDBOX_DISCLAIMER };
}

/** Standard error envelope shape produced by the global error handler. */
export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
    requestId: z.string(),
  }),
});
export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;
