import { describe, expect, it } from 'vitest';
import type {
  QueryResult,
  QueryRunner,
} from '../../shared/application/ports/transaction-manager.port.js';
import { makeEvent } from './domain-event.js';
import { createInMemoryEventBus } from './event-bus.js';
import { createPgInboxStore } from './inbox-store.js';
import { registerEventHandlers } from './register-event-handlers.js';

class FakeRunner implements QueryRunner {
  public calls: { sql: string; params: readonly unknown[] }[] = [];
  public claimed = new Set<string>();

  async query<T = unknown>(sql: string, params: readonly unknown[] = []): Promise<QueryResult<T>> {
    this.calls.push({ sql, params });
    if (sql.includes('INSERT INTO inbox_events')) {
      const key = `${params[0]}:${params[1]}`;
      if (this.claimed.has(key)) return { rows: [], rowCount: 0 } as QueryResult<T>;
      this.claimed.add(key);
      return { rows: [{ id: 'new' } as unknown as T], rowCount: 1 };
    }
    if (sql.includes('FROM inbox_events')) {
      const key = `${params[0]}:${params[1]}`;
      return { rows: [], rowCount: this.claimed.has(key) ? 1 : 0 } as QueryResult<T>;
    }
    return { rows: [], rowCount: 0 };
  }
}

describe('inbox-store', () => {
  it('tryClaim() returns true on first call, false on subsequent calls', async () => {
    const runner = new FakeRunner();
    const inbox = createPgInboxStore({ defaultRunner: () => runner });

    const first = await inbox.tryClaim('event-1', 'handlerA');
    const second = await inbox.tryClaim('event-1', 'handlerA');

    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it('tryClaim() distinguishes between handlers for the same event', async () => {
    const runner = new FakeRunner();
    const inbox = createPgInboxStore({ defaultRunner: () => runner });

    expect(await inbox.tryClaim('event-1', 'handlerA')).toBe(true);
    expect(await inbox.tryClaim('event-1', 'handlerB')).toBe(true);
    expect(await inbox.tryClaim('event-1', 'handlerA')).toBe(false);
  });

  it('hasProcessed() reports prior claims', async () => {
    const runner = new FakeRunner();
    const inbox = createPgInboxStore({ defaultRunner: () => runner });

    expect(await inbox.hasProcessed('event-1', 'handlerA')).toBe(false);
    await inbox.tryClaim('event-1', 'handlerA');
    expect(await inbox.hasProcessed('event-1', 'handlerA')).toBe(true);
  });

  it('registerEventHandlers() runs each handler exactly once when guarded by the inbox', async () => {
    const runner = new FakeRunner();
    const inbox = createPgInboxStore({ defaultRunner: () => runner });
    const bus = createInMemoryEventBus();

    const calls: string[] = [];
    registerEventHandlers(
      bus,
      [
        {
          handlerName: 'orders.notify',
          eventName: 'orders.created',
          handler: (e) => {
            calls.push(e.id);
          },
        },
      ],
      { inbox },
    );

    const event = makeEvent('orders.created', { orderId: 'o-1' });
    await bus.publish(event);
    await bus.publish(event); // duplicate delivery
    await bus.publish(event); // and another

    expect(calls).toEqual([event.id]); // handler invoked once despite three publishes
  });
});
