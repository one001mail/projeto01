/**
 * `created` presenter.
 *
 * Specialisation of `ok` for resource-creation endpoints. The route is
 * still responsible for setting status 201 (and a `Location` header when
 * applicable); the presenter only stamps `created: true` on the envelope
 * so clients can branch deterministically without inspecting status codes.
 */
import type { OkEnvelope } from './ok.presenter.js';

export interface CreatedEnvelope<TData> extends OkEnvelope<TData> {
  readonly created: true;
}

export function presentCreated<TData>(data: TData, requestId?: string): CreatedEnvelope<TData> {
  const env: { ok: true; created: true; data: TData; requestId?: string } = {
    ok: true,
    created: true,
    data,
  };
  if (requestId !== undefined) env.requestId = requestId;
  return env as CreatedEnvelope<TData>;
}
