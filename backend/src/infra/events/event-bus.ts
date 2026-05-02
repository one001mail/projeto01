import type {
  EventBus,
  EventHandler,
  Unsubscribe,
} from '../../shared/application/ports/event-bus.port.js';
/**
 * In-memory EventBus adapter.
 *
 * Implements the canonical port from `shared/application/ports/event-bus.port`.
 * The `EventBus` and helper types are re-exported here so existing imports
 * (`@infra/events/event-bus`) continue to work.
 *
 * The B3 outbox-backed bus will implement the same port and replace this
 * adapter in production composition without subscriber-side changes.
 */
import type { DomainEvent } from './domain-event.js';

export type { EventBus, EventHandler, Unsubscribe };

export interface InMemoryEventBusOptions {
  /** Called when a handler throws. Defaults to swallow + console.warn. */
  onError?: (err: unknown, event: DomainEvent) => void;
}

export function createInMemoryEventBus(options: InMemoryEventBusOptions = {}): EventBus {
  const handlers = new Map<string, Set<EventHandler>>();
  const onError =
    options.onError ??
    ((err, event) => {
      // biome-ignore lint/suspicious/noConsole: bus is infra; structured logger may not be available.
      console.warn('event handler error', { event: event.name, err });
    });

  return {
    async publish(event) {
      const set = handlers.get(event.name);
      if (!set || set.size === 0) return;
      // Snapshot: subscriptions changing during dispatch must not corrupt iteration.
      const snapshot = Array.from(set);
      for (const h of snapshot) {
        try {
          await h(event);
        } catch (err) {
          onError(err, event);
        }
      }
    },
    subscribe(name, handler) {
      let set = handlers.get(name);
      if (!set) {
        set = new Set();
        handlers.set(name, set);
      }
      set.add(handler as EventHandler);
      return (): void => {
        set?.delete(handler as EventHandler);
        if (set && set.size === 0) handlers.delete(name);
      };
    },
    handlerCount(name) {
      return handlers.get(name)?.size ?? 0;
    },
    async close() {
      handlers.clear();
    },
  };
}
