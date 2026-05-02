/**
 * Domain Event — canonical application contract.
 *
 * Lives in `shared/application/ports/` because every layer above infra must
 * be able to name the events that flow through the bus without reaching
 * into `infra/`. The infra layer owns *how* events are persisted / routed;
 * the application layer owns *what* an event is.
 *
 * Events are immutable. Renames are breaking changes; add a new event and
 * deprecate the old one rather than mutating `payload`.
 */
export interface DomainEvent<TPayload = unknown> {
  readonly id: string;
  readonly name: string;
  readonly occurredAt: string;
  readonly payload: TPayload;
  /** Optional aggregate identity for ordering / partitioning downstream. */
  readonly aggregateId?: string;
}
