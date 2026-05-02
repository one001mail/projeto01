import { describe, expect, it } from 'vitest';
import { makeEvent } from './domain-event.js';
import { createInMemoryEventBus } from './event-bus.js';
import { createInMemoryInboxStore } from './in-memory-inbox-store.js';
import { createInMemoryOutboxStore } from './in-memory-outbox-store.js';
import { createOutboxDispatcher } from './outbox-dispatcher.js';
import { registerEventHandlers } from './register-event-handlers.js';

describe('outbox dispatcher', () => {
  it('tick() publishes pending rows and marks them processed', async () => {
    const outbox = createInMemoryOutboxStore();
    const bus = createInMemoryEventBus();
    const delivered: string[] = [];
    bus.subscribe('order.created', async (e) => {
      delivered.push(e.id);
    });

    const dispatcher = createOutboxDispatcher({ outbox, eventBus: bus });

    const e1 = makeEvent('order.created', { n: 1 });
    const e2 = makeEvent('order.created', { n: 2 });
    await outbox.save(e1);
    await outbox.save(e2);

    const stats = await dispatcher.tick(10);

    expect(stats).toEqual({ processed: 2, failed: 0, scanned: 2 });
    expect(delivered).toEqual([e1.id, e2.id]);
    expect(await outbox.listPending(10)).toHaveLength(0);
    expect(outbox.snapshot().every((r) => r.status === 'processed')).toBe(true);
  });

  it('tick() handles empty queue', async () => {
    const outbox = createInMemoryOutboxStore();
    const bus = createInMemoryEventBus();
    const dispatcher = createOutboxDispatcher({ outbox, eventBus: bus });

    expect(await dispatcher.tick(10)).toEqual({ processed: 0, failed: 0, scanned: 0 });
  });

  it('tick() rolls a failing handler into markFailed() and keeps the row pending until it escalates', async () => {
    const outbox = createInMemoryOutboxStore({ maxAttempts: 3 });
    const bus = createInMemoryEventBus({
      // Silence the bus error sink; dispatcher handles logging.
      onError: () => undefined,
    });
    let calls = 0;
    bus.subscribe('flaky', async () => {
      calls += 1;
      throw new Error('simulated handler failure');
    });

    const dispatcher = createOutboxDispatcher({ outbox, eventBus: bus });

    await outbox.save(makeEvent('flaky', {}));

    // The in-memory bus swallows handler errors via onError, so publish()
    // will NOT throw — meaning dispatcher records success. Verify that and
    // switch to a publish that rethrows to exercise markFailed.
    await dispatcher.tick(10);
    expect(calls).toBe(1);
    expect(outbox.snapshot()[0]?.status).toBe('processed');

    // Now test explicit publish failure by replacing the event bus.
    const throwingBus = {
      ...bus,
      publish: async () => {
        throw new Error('bus blew up');
      },
    };
    const failingDispatcher = createOutboxDispatcher({
      outbox,
      eventBus: throwingBus as unknown as typeof bus,
    });
    outbox.reset();
    await outbox.save(makeEvent('flaky2', {}));

    const stats1 = await failingDispatcher.tick(10);
    expect(stats1).toEqual({ processed: 0, failed: 1, scanned: 1 });
    expect(outbox.snapshot()[0]?.status).toBe('pending');
    expect(outbox.snapshot()[0]?.attempts).toBe(1);

    await failingDispatcher.tick(10);
    await failingDispatcher.tick(10);

    const final = outbox.snapshot()[0];
    expect(final?.attempts).toBe(3);
    expect(final?.status).toBe('failed');
    expect(final?.last_error).toBe('bus blew up');
  });

  it('integrates with inbox dedup so handlers run once across retried deliveries', async () => {
    const outbox = createInMemoryOutboxStore();
    const inbox = createInMemoryInboxStore();
    const bus = createInMemoryEventBus();
    const calls: string[] = [];

    registerEventHandlers(
      bus,
      [
        {
          handlerName: 'order.notify',
          eventName: 'order.created',
          handler: async (e) => {
            calls.push(e.id);
          },
        },
      ],
      { inbox },
    );

    const dispatcher = createOutboxDispatcher({ outbox, eventBus: bus });
    const e = makeEvent('order.created', { n: 1 });

    // First save + tick: delivered once.
    await outbox.save(e);
    await dispatcher.tick(10);
    expect(calls).toEqual([e.id]);

    // Simulate an at-least-once redelivery: same event id saved again
    // would be deduped by outbox.save (idempotent by id); use a direct
    // bus.publish to re-trigger the wrapped handler.
    await bus.publish(e);
    await bus.publish(e);

    expect(calls).toEqual([e.id]); // still exactly one invocation
  });

  it('tick(0) short-circuits without touching the store', async () => {
    const outbox = createInMemoryOutboxStore();
    const bus = createInMemoryEventBus();
    const dispatcher = createOutboxDispatcher({ outbox, eventBus: bus });
    await outbox.save(makeEvent('x', {}));

    const stats = await dispatcher.tick(0);
    expect(stats).toEqual({ processed: 0, failed: 0, scanned: 0 });
    expect(await outbox.listPending(10)).toHaveLength(1); // untouched
  });
});
