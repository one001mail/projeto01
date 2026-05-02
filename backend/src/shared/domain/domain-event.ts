/**
 * Domain Event envelope for aggregate-raised events.
 *
 * This is the *in-memory* shape aggregates raise; the infra outbox will
 * serialize it before persistence. All events must set `sandbox: true`
 * in their payload to reinforce the educational nature of the system.
 */
export interface DomainEventEnvelope<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly eventId: string;
  readonly eventName: string;
  readonly occurredAt: string;
  readonly aggregateId?: string;
  readonly correlationId?: string;
  readonly payload: TPayload & { readonly sandbox: true };
}

export function makeDomainEvent<TPayload extends Record<string, unknown>>(
  input: Omit<DomainEventEnvelope<TPayload>, 'payload' | 'eventId' | 'occurredAt'> & {
    eventId?: string;
    occurredAt?: string;
    payload: TPayload;
  },
): DomainEventEnvelope<TPayload> {
  return {
    eventId: input.eventId ?? crypto.randomUUID(),
    eventName: input.eventName,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    ...(input.aggregateId ? { aggregateId: input.aggregateId } : {}),
    ...(input.correlationId ? { correlationId: input.correlationId } : {}),
    payload: { ...input.payload, sandbox: true as const },
  };
}
