import { describe, expect, it } from 'vitest';
import { makeEvent } from './domain-event.js';
import { createInMemoryOutboxStore } from './in-memory-outbox-store.js';

describe('in-memory outbox store', () => {
  it('save() makes events visible in FIFO order via listPending', async () => {
    const store = createInMemoryOutboxStore();
    const e1 = makeEvent('a.happened', { n: 1 });
    const e2 = makeEvent('b.happened', { n: 2 });
    const e3 = makeEvent('c.happened', { n: 3 });

    await store.save(e1);
    await store.save(e2);
    await store.save(e3);

    const rows = await store.listPending(10);
    expect(rows.map((r) => r.event_name)).toEqual(['a.happened', 'b.happened', 'c.happened']);
    expect(rows.every((r) => r.status === 'pending')).toBe(true);
  });

  it('listPending respects the batch limit', async () => {
    const store = createInMemoryOutboxStore();
    for (let i = 0; i < 5; i++) {
      await store.save(makeEvent('evt', { i }));
    }
    expect((await store.listPending(2)).length).toBe(2);
    expect((await store.listPending(0)).length).toBe(0);
  });

  it('markProcessed removes rows from pending view', async () => {
    const store = createInMemoryOutboxStore();
    const e = makeEvent('x', {});
    await store.save(e);
    await store.markProcessed(e.id);
    expect(await store.listPending(10)).toHaveLength(0);
    const [snap] = store.snapshot();
    expect(snap?.status).toBe('processed');
    expect(snap?.processed_at).toBeInstanceOf(Date);
  });

  it('markFailed escalates to status=failed once attempts >= maxAttempts', async () => {
    const store = createInMemoryOutboxStore({ maxAttempts: 3 });
    const e = makeEvent('y', {});
    await store.save(e);

    await store.markFailed(e.id, 'boom-1');
    expect(store.snapshot()[0]?.status).toBe('pending');
    expect(store.snapshot()[0]?.attempts).toBe(1);

    await store.markFailed(e.id, 'boom-2');
    expect(store.snapshot()[0]?.status).toBe('pending');

    await store.markFailed(e.id, 'boom-3');
    expect(store.snapshot()[0]?.status).toBe('failed');
    expect(store.snapshot()[0]?.last_error).toBe('boom-3');
    // Failed rows no longer appear in pending
    expect(await store.listPending(10)).toHaveLength(0);
  });

  it('save() is idempotent on event.id', async () => {
    const store = createInMemoryOutboxStore();
    const e = makeEvent('z', { v: 1 });
    const id1 = await store.save(e);
    const id2 = await store.save(e);
    expect(id1).toBe(id2);
    expect(store.snapshot()).toHaveLength(1);
  });

  it('reset() clears all entries', async () => {
    const store = createInMemoryOutboxStore();
    await store.save(makeEvent('a', {}));
    store.reset();
    expect(store.snapshot()).toHaveLength(0);
  });
});
