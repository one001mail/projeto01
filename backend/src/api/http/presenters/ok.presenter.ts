/**
 * `ok` presenter.
 *
 * Wraps a successful response payload into the canonical envelope used by
 * every public endpoint:
 *
 *   { ok: true, data, meta?, requestId }
 *
 * `requestId` lets clients correlate a response to a server-side log line
 * without inspecting headers; it is also echoed in the error envelope.
 */
export interface OkEnvelope<TData, TMeta = undefined> {
  readonly ok: true;
  readonly data: TData;
  readonly meta?: TMeta;
  readonly requestId?: string;
}

export function presentOk<TData>(data: TData, requestId?: string): OkEnvelope<TData>;
export function presentOk<TData, TMeta>(
  data: TData,
  requestId: string | undefined,
  meta: TMeta,
): OkEnvelope<TData, TMeta>;
export function presentOk<TData, TMeta = undefined>(
  data: TData,
  requestId?: string,
  meta?: TMeta,
): OkEnvelope<TData, TMeta> {
  const env: { ok: true; data: TData; meta?: TMeta; requestId?: string } = { ok: true, data };
  if (meta !== undefined) env.meta = meta;
  if (requestId !== undefined) env.requestId = requestId;
  return env as OkEnvelope<TData, TMeta>;
}
