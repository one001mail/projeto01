/**
 * `paginated` presenter.
 *
 * Wraps a list of items into the canonical envelope:
 *
 *   { ok: true, data: T[], meta: { limit, offset, total, count, hasMore }, requestId? }
 *
 * Callers typically derive `total` from a separate count query, but the
 * presenter accepts whatever the use case returns; computing `hasMore` is
 * delegated here so every list endpoint behaves identically.
 */
import type { PaginationMeta } from '../schemas/common.schemas.js';

export interface PaginatedEnvelope<T> {
  readonly ok: true;
  readonly data: readonly T[];
  readonly meta: PaginationMeta;
  readonly requestId?: string;
}

export interface PaginatedPresenterInput<T> {
  readonly items: readonly T[];
  readonly limit: number;
  readonly offset: number;
  readonly total: number;
}

export function presentPaginated<T>(
  input: PaginatedPresenterInput<T>,
  requestId?: string,
): PaginatedEnvelope<T> {
  const limit = Math.max(0, Math.floor(input.limit));
  const offset = Math.max(0, Math.floor(input.offset));
  const total = Math.max(0, Math.floor(input.total));
  const count = input.items.length;
  const hasMore = offset + count < total;
  const env: {
    ok: true;
    data: readonly T[];
    meta: PaginationMeta;
    requestId?: string;
  } = {
    ok: true,
    data: input.items,
    meta: { limit, offset, total, count, hasMore },
  };
  if (requestId !== undefined) env.requestId = requestId;
  return env as PaginatedEnvelope<T>;
}
