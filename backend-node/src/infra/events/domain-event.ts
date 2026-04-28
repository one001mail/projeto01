/**
 * Domain Event base type.
 *
 * Every event published on the bus is a plain object with:
 *   - `name`: globally-unique, dotted, past-tense (e.g. `payment.captured`).
 *   - `id`: ULID/UUID, generated at the source of truth (the aggregate).
 *   - `occurredAt`: ISO-8601 instant produced when the aggregate emits it.
 *   - `payload`: serializable application data — no class instances.
 *
 * Events are immutable contracts. Renames are breaking changes; introduce a
 * new event name and deprecate the old one rather than mutating `payload`.
 */
export interface DomainEvent<TPayload = unknown> {
  readonly id: string;
  readonly name: string;
  readonly occurredAt: string;
  readonly payload: TPayload;
  /** Optional aggregate identity for ordering / partitioning downstream. */
  readonly aggregateId?: string;
}

export function makeEvent<TPayload>(
  name: string,
  payload: TPayload,
  aggregateId?: string,
): DomainEvent<TPayload> {
  return {
    id: crypto.randomUUID(),
    name,
    occurredAt: new Date().toISOString(),
    payload,
    ...(aggregateId !== undefined ? { aggregateId } : {}),
  };
}
