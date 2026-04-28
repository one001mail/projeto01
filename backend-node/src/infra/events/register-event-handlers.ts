/**
 * Event handler registration.
 *
 * Centralises wiring of subscribers onto an `EventBus`, optionally guarded
 * by an `InboxStore` so each `(event.id, handlerName)` is processed at most
 * once. Modules contribute registrations from their `index.ts`; this helper
 * is the only place that knows how to apply the inbox guard.
 *
 * Future dispatcher (B3) will use the same registration shape but read events
 * from `outbox_events` instead of an in-process bus.
 */
import type { DomainEvent } from './domain-event.js';
import type {
  EventBus,
  EventHandler,
  Unsubscribe,
} from '../../shared/application/ports/event-bus.port.js';
import type { InboxStore } from './inbox-store.js';

export interface EventHandlerRegistration<E extends DomainEvent = DomainEvent> {
  handlerName: string;
  eventName: E['name'];
  handler: EventHandler<E>;
}

export interface RegisterOptions {
  /** When provided, every handler is wrapped with `inbox.tryClaim()`. */
  inbox?: InboxStore;
  /** Per-handler error sink. Defaults to swallow + console.warn. */
  onError?: (err: unknown, registration: EventHandlerRegistration, event: DomainEvent) => void;
}

export function registerEventHandlers(
  bus: EventBus,
  registrations: readonly EventHandlerRegistration[],
  options: RegisterOptions = {},
): Unsubscribe[] {
  const { inbox, onError } = options;
  const unsubs: Unsubscribe[] = [];

  for (const reg of registrations) {
    const wrapped: EventHandler = async (event) => {
      try {
        if (inbox) {
          const claimed = await inbox.tryClaim(event.id, reg.handlerName);
          if (!claimed) return; // duplicate — already processed
        }
        await (reg.handler as EventHandler)(event);
      } catch (err) {
        if (onError) onError(err, reg, event);
        else {
          // biome-ignore lint/suspicious/noConsole: last-resort sink.
          console.warn('event handler error', {
            handler: reg.handlerName,
            event: event.name,
            err,
          });
        }
      }
    };
    unsubs.push(bus.subscribe(reg.eventName, wrapped));
  }

  return unsubs;
}
