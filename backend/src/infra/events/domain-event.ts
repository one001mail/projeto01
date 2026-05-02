/**
 * Domain event factory (infra-side).
 *
 * The `DomainEvent` *type* lives in `shared/application/ports/` so every
 * layer can name events without depending on infra. This file owns the
 * concrete *factory* — it uses `crypto.randomUUID()` and real wall-clock
 * time, which are infrastructure concerns.
 *
 * Tests that need determinism should construct `DomainEvent` literals
 * directly (the type is exported from the shared port) or inject a custom
 * factory via a port.
 */
import type { DomainEvent } from '../../shared/application/ports/domain-event.port.js';

export type { DomainEvent };

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
