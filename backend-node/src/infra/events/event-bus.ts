/**
 * In-memory event bus.
 *
 * Phase-B1.5 contract + working in-memory implementation. The bus is
 * deliberately minimal:
 *   - publish/subscribe by event name
 *   - synchronous-async dispatch (each handler awaited individually)
 *   - per-handler errors are isolated and logged via the `onError` hook so
 *     one bad subscriber can't poison the rest
 *
 * In B3 we add: an outbox-backed durable bus, retry policy, dead-letter sink,
 * and replay. This in-memory version stays for tests and intra-process events.
 */
import type { DomainEvent } from './domain-event.js';

export type EventHandler<E extends DomainEvent = DomainEvent> = (event: E) => Promise<void> | void;

export type Unsubscribe = () => void;

export interface EventBus {
  publish<E extends DomainEvent>(event: E): Promise<void>;
  subscribe<E extends DomainEvent>(name: E['name'], handler: EventHandler<E>): Unsubscribe;
  /** Number of handlers for a given event name (debug / metrics). */
  handlerCount(name: string): number;
  /** Releases all handlers. Idempotent. */
  close(): Promise<void>;
}

export interface InMemoryEventBusOptions {
  /** Called when a handler throws. Defaults to swallow + console.warn. */
  onError?: (err: unknown, event: DomainEvent) => void;
}

export function createInMemoryEventBus(options: InMemoryEventBusOptions = {}): EventBus {
  const handlers = new Map<string, Set<EventHandler>>();
  const onError =
    options.onError ??
    ((err, event) => {
      // Last-resort log; structured logger is not in scope here.
      // biome-ignore lint/suspicious/noConsole: bus is infra; structured logger may not be available.
      console.warn('event handler error', { event: event.name, err });
    });

  return {
    async publish(event) {
      const set = handlers.get(event.name);
      if (!set || set.size === 0) return;
      // Snapshot so handlers that subscribe/unsubscribe during dispatch
      // don't mutate the set we're iterating.
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
      return () => {
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
