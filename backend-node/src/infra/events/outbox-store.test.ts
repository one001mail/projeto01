import { describe, expect, it } from 'vitest';
import type {
  QueryResult,
  QueryRunner,
} from '../../shared/application/ports/transaction-manager.port.js';
import { makeEvent } from './domain-event.js';
import { createPgOutboxStore } from './outbox-store.js';

class FakeRunner implements QueryRunner {
  public calls: { sql: string; params: readonly unknown[] }[] = [];
  public fixtures: Array<(sql: string, params: readonly unknown[]) => QueryResult<unknown>> = [];

  async query<T = unknown>(sql: string, params: readonly unknown[] = []): Promise<QueryResult<T>> {
    this.calls.push({ sql, params });
    const f = this.fixtures.shift();
    if (f) return f(sql, params) as QueryResult<T>;
    return { rows: [], rowCount: 0 };
  }
}

describe('outbox-store', () => {
  it('save() inserts a pending row with the event payload', async () => {
    const runner = new FakeRunner();
    runner.fixtures.push(() => ({ rows: [{ id: 'returned-id' }], rowCount: 1 }));
    const store = createPgOutboxStore({ defaultRunner: () => runner });

    const event = makeEvent('orders.created', { orderId: 'o-1' }, 'agg-1');
    const id = await store.save(event);

    expect(id).toBe('returned-id');
    expect(runner.calls).toHaveLength(1);
    const call = runner.calls[0]!;
    expect(call.sql).toMatch(/INSERT INTO outbox_events/);
    expect(call.sql).toMatch(/'pending'/);
    expect(call.params[0]).toBe(event.id);
    expect(call.params[1]).toBe('orders.created');
    expect(call.params[2]).toBe('agg-1');
    expect(JSON.parse(call.params[3] as string)).toEqual({ orderId: 'o-1' });
  });

  it('save() uses an explicit runner when provided, ignoring the default', async () => {
    const def = new FakeRunner();
    const explicit = new FakeRunner();
    explicit.fixtures.push(() => ({ rows: [{ id: 'x' }], rowCount: 1 }));
    const store = createPgOutboxStore({ defaultRunner: () => def });

    await store.save(makeEvent('payments.captured', { amount: 1 }), explicit);

    expect(explicit.calls).toHaveLength(1);
    expect(def.calls).toHaveLength(0);
  });

  it('markFailed() escalates to status=failed once attempts >= 5', async () => {
    const runner = new FakeRunner();
    const store = createPgOutboxStore({ defaultRunner: () => runner });

    await store.markFailed('id-1', 'boom');
    expect(runner.calls[0]!.sql).toMatch(/attempts \+ 1 >= 5/);
    expect(runner.calls[0]!.params).toEqual(['id-1', 'boom']);
  });
});
