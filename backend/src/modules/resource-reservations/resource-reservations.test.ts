/**
 * resource-reservations module — unit + integration tests against the
 * in-memory adapter. Sandbox-only assertions.
 */
import { describe, expect, it } from 'vitest';
import { FixedClock } from '../../shared/application/ports/clock.port.js';
import { SequentialUuidGenerator } from '../../shared/application/ports/uuid.port.js';
import { GetReservationStatusUseCase } from './application/use-cases/get-reservation-status.use-case.js';
import { ReconcileReservationsUseCase } from './application/use-cases/reconcile-reservations.use-case.js';
import { ReleaseResourceUseCase } from './application/use-cases/release-resource.use-case.js';
import { ReserveResourceUseCase } from './application/use-cases/reserve-resource.use-case.js';
import { AllocationPriorityPolicy } from './domain/policies/allocation-priority.policy.js';
import { ReserveSufficiencyPolicy } from './domain/policies/reserve-sufficiency.policy.js';
import { SANDBOX_RESERVATION_DISCLAIMER } from './domain/policies/sandbox-reservation.policy.js';
import { AllocationId } from './domain/value-objects/allocation-id.vo.js';
import { ReservationAmount } from './domain/value-objects/reservation-amount.vo.js';
import { InMemoryResourceReservationRepository } from './infra/persistence/in-memory-resource-reservation.repository.js';

const NOW = new Date('2025-01-01T00:00:00Z');
const SESSION_ID = '00000000-0000-4000-8000-00000000aaaa';

describe('resource-reservations domain — value objects', () => {
  it('ReservationAmount rejects negatives and infinities', () => {
    expect(() => ReservationAmount.of(-1)).toThrow();
    expect(() => ReservationAmount.of(Number.POSITIVE_INFINITY)).toThrow();
  });
  it('AllocationId lowercases', () => {
    expect(AllocationId.fromString('Pool').toString()).toBe('pool');
  });
});

describe('resource-reservations domain — policies', () => {
  it('ReserveSufficiencyPolicy detects overflow', () => {
    expect(
      ReserveSufficiencyPolicy.isSufficient({
        cap: ReservationAmount.of(100),
        alreadyReserved: ReservationAmount.of(60),
        requested: ReservationAmount.of(30),
      }),
    ).toBe(true);
    expect(
      ReserveSufficiencyPolicy.isSufficient({
        cap: ReservationAmount.of(100),
        alreadyReserved: ReservationAmount.of(60),
        requested: ReservationAmount.of(50),
      }),
    ).toBe(false);
  });
  it('AllocationPriorityPolicy orders by namespace then time', () => {
    const a = { namespace: AllocationId.fromString('a'), createdAt: new Date(2) };
    const b = { namespace: AllocationId.fromString('b'), createdAt: new Date(1) };
    expect(AllocationPriorityPolicy.compare(a, b)).toBeLessThan(0);
    const a1 = { namespace: AllocationId.fromString('a'), createdAt: new Date(1) };
    const a2 = { namespace: AllocationId.fromString('a'), createdAt: new Date(2) };
    expect(AllocationPriorityPolicy.compare(a1, a2)).toBeLessThan(0);
  });
});

describe('resource-reservations — reserve use case', () => {
  it('rejects invalid input shapes', async () => {
    const repo = new InMemoryResourceReservationRepository();
    const uc = new ReserveResourceUseCase({
      repo,
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
      caps: {},
      defaultCap: 100,
    });
    expect((await uc.execute({ namespace: '!', sessionId: SESSION_ID, amount: 1 })).ok).toBe(false);
    expect((await uc.execute({ namespace: 'demo', sessionId: 'not-uuid', amount: 1 })).ok).toBe(
      false,
    );
    expect((await uc.execute({ namespace: 'demo', sessionId: SESSION_ID, amount: 0 })).ok).toBe(
      false,
    );
    expect((await uc.execute({ namespace: 'demo', sessionId: SESSION_ID, amount: -5 })).ok).toBe(
      false,
    );
  });

  it('persists a sandbox reservation with disclaimer + outbox event', async () => {
    const repo = new InMemoryResourceReservationRepository();
    const events: string[] = [];
    const uc = new ReserveResourceUseCase({
      repo,
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
      caps: {},
      defaultCap: 100,
      outbox: {
        async save(e) {
          events.push(e.name);
          return e.id;
        },
      },
    });
    const out = await uc.execute({
      namespace: 'demo',
      sessionId: SESSION_ID,
      amount: 50,
    });
    expect(out.ok).toBe(true);
    if (!out.ok) throw new Error('unreachable');
    expect(out.value.status).toBe('reserved');
    expect(out.value.amount).toBe(50);
    expect(out.value.disclaimer).toBe(SANDBOX_RESERVATION_DISCLAIMER);
    expect(repo.size()).toBe(1);
    expect(events).toContain('resource-reservations.reserved');
  });

  it('returns INSUFFICIENT_ALLOCATION when the cap is exceeded', async () => {
    const repo = new InMemoryResourceReservationRepository();
    const events: string[] = [];
    const uc = new ReserveResourceUseCase({
      repo,
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
      caps: { demo: 100 },
      defaultCap: 100,
      outbox: {
        async save(e) {
          events.push(e.name);
          return e.id;
        },
      },
    });
    const a = await uc.execute({ namespace: 'demo', sessionId: SESSION_ID, amount: 60 });
    expect(a.ok).toBe(true);
    const b = await uc.execute({ namespace: 'demo', sessionId: SESSION_ID, amount: 60 });
    expect(b.ok).toBe(false);
    if (!b.ok) expect(b.error.kind).toBe('INSUFFICIENT_ALLOCATION');
    expect(events).toContain('resource-reservations.failed');
  });

  it('does NOT mutate persisted state when reserve fails', async () => {
    const repo = new InMemoryResourceReservationRepository();
    const uc = new ReserveResourceUseCase({
      repo,
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
      caps: { demo: 1 },
      defaultCap: 1,
    });
    await uc.execute({ namespace: 'demo', sessionId: SESSION_ID, amount: 1 });
    expect(repo.size()).toBe(1);
    const failed = await uc.execute({
      namespace: 'demo',
      sessionId: SESSION_ID,
      amount: 1,
    });
    expect(failed.ok).toBe(false);
    expect(repo.size()).toBe(1); // unchanged
  });
});

describe('resource-reservations — release / status', () => {
  it('release moves reserved -> released and is idempotent against repeats', async () => {
    const repo = new InMemoryResourceReservationRepository();
    const reserveUc = new ReserveResourceUseCase({
      repo,
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
      caps: {},
      defaultCap: 100,
    });
    const created = await reserveUc.execute({
      namespace: 'demo',
      sessionId: SESSION_ID,
      amount: 5,
    });
    if (!created.ok) throw new Error('unreachable');

    const releaseUc = new ReleaseResourceUseCase({
      repo,
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
    });
    const released = await releaseUc.execute({ id: created.value.id });
    expect(released.ok).toBe(true);
    if (!released.ok) throw new Error('unreachable');
    expect(released.value.status).toBe('released');
    const again = await releaseUc.execute({ id: created.value.id });
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.error.kind).toBe('INVALID_STATE');
  });

  it('getStatus refreshes derived expiration', async () => {
    const repo = new InMemoryResourceReservationRepository();
    const reserveUc = new ReserveResourceUseCase({
      repo,
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
      caps: {},
      defaultCap: 100,
    });
    const created = await reserveUc.execute({
      namespace: 'demo',
      sessionId: SESSION_ID,
      amount: 5,
      ttlSeconds: 1,
    });
    if (!created.ok) throw new Error('unreachable');
    const later = new Date(NOW.getTime() + 5_000);
    const get = new GetReservationStatusUseCase(repo, new FixedClock(later));
    const out = await get.execute({ id: created.value.id });
    expect(out.ok).toBe(true);
    if (!out.ok) throw new Error('unreachable');
    expect(out.value.status).toBe('expired');
  });
});

describe('resource-reservations — reconcile', () => {
  it('expires reservations whose TTL has elapsed and emits events', async () => {
    const repo = new InMemoryResourceReservationRepository();
    const reserveUc = new ReserveResourceUseCase({
      repo,
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
      caps: {},
      defaultCap: 100,
    });
    await reserveUc.execute({
      namespace: 'demo',
      sessionId: SESSION_ID,
      amount: 1,
      ttlSeconds: 1,
    });
    await reserveUc.execute({
      namespace: 'demo',
      sessionId: SESSION_ID,
      amount: 1,
      ttlSeconds: 60,
    });

    const events: string[] = [];
    const later = new Date(NOW.getTime() + 5_000);
    const uc = new ReconcileReservationsUseCase({
      repo,
      clock: new FixedClock(later),
      uuid: new SequentialUuidGenerator(),
      outbox: {
        async save(e) {
          events.push(e.name);
          return e.id;
        },
      },
    });
    const out = await uc.execute({});
    expect(out.ok).toBe(true);
    if (!out.ok) throw new Error('unreachable');
    expect(out.value.expired).toBe(1);
    expect(events).toContain('resource-reservations.expired');

    // Second pass — nothing new to expire.
    const again = await uc.execute({});
    expect(again.ok).toBe(true);
    if (!again.ok) throw new Error('unreachable');
    expect(again.value.expired).toBe(0);
  });
});

describe('resource-reservations — sandbox guarantees', () => {
  it('release after expiration cannot revive a reservation', async () => {
    const repo = new InMemoryResourceReservationRepository();
    const reserveUc = new ReserveResourceUseCase({
      repo,
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
      caps: {},
      defaultCap: 100,
    });
    const created = await reserveUc.execute({
      namespace: 'demo',
      sessionId: SESSION_ID,
      amount: 1,
      ttlSeconds: 1,
    });
    if (!created.ok) throw new Error('unreachable');
    const later = new Date(NOW.getTime() + 5_000);
    const releaseUc = new ReleaseResourceUseCase({
      repo,
      clock: new FixedClock(later),
      uuid: new SequentialUuidGenerator(),
    });
    const out = await releaseUc.execute({ id: created.value.id });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.kind).toBe('INVALID_STATE');
  });

  it('disclaimer is emitted on every DTO', async () => {
    const repo = new InMemoryResourceReservationRepository();
    const reserveUc = new ReserveResourceUseCase({
      repo,
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
      caps: {},
      defaultCap: 100,
    });
    const out = await reserveUc.execute({
      namespace: 'demo',
      sessionId: SESSION_ID,
      amount: 1,
    });
    expect(out.ok).toBe(true);
    if (!out.ok) throw new Error('unreachable');
    expect(out.value.disclaimer).toMatch(/Sandbox-only/);
  });
});
