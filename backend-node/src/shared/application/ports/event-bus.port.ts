/**
 * Event Bus port (canonical interface).
 *
 * Lives in `shared/application/ports/` so domain modules can subscribe and
 * publish without importing infra. The in-memory adapter under
 * `infra/events/event-bus.ts` implements this port. The outbox-backed bus
 * (B3) will implement it too, transparently to subscribers.
 */
import type { DomainEvent } from '../../../infra/events/domain-event.js';

export type EventHandler<E extends DomainEvent = DomainEvent> = (
  event: E,
) => Promise<void> | void;

export type Unsubscribe = () => void;

export interface EventBus {
  publish<E extends DomainEvent>(event: E): Promise<void>;
  subscribe<E extends DomainEvent>(name: E['name'], handler: EventHandler<E>): Unsubscribe;
  /** Number of handlers registered for `name` (debug / metrics). */
  handlerCount(name: string): number;
  /** Releases all handlers; idempotent. */
  close(): Promise<void>;
}
