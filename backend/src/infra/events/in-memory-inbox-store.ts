/**
 * In-memory InboxStore (sandbox-only fallback).
 *
 * Mirrors the semantics of the PG adapter: `tryClaim()` is atomic on
 * `(eventId, handlerName)`; the first call wins and returns true, any
 * subsequent call with the same pair returns false.
 */
import type { InboxStore } from './inbox-store.js';

export interface InMemoryInboxStore extends InboxStore {
  reset(): void;
}

export function createInMemoryInboxStore(): InMemoryInboxStore {
  const claimed = new Set<string>();
  const key = (eventId: string, handlerName: string): string => `${eventId}::${handlerName}`;

  return {
    async tryClaim(eventId: string, handlerName: string): Promise<boolean> {
      const k = key(eventId, handlerName);
      if (claimed.has(k)) return false;
      claimed.add(k);
      return true;
    },
    async hasProcessed(eventId: string, handlerName: string): Promise<boolean> {
      return claimed.has(key(eventId, handlerName));
    },
    reset(): void {
      claimed.clear();
    },
  };
}
