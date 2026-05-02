import { describe, expect, it } from 'vitest';
import { ReleaseScheduledPaymentUseCase } from './application/use-cases/release-scheduled-payment.use-case.js';
import { SchedulePaymentsUseCase } from './application/use-cases/schedule-payments.use-case.js';
import { InMemoryPaymentSchedulerRepository } from './infra/persistence/in-memory-payment-scheduler.repository.js';

describe('payment-scheduler (SANDBOX, MOCK)', () => {
  it('schedules a mock payment', async () => {
    const repo = new InMemoryPaymentSchedulerRepository();
    const uc = new SchedulePaymentsUseCase(repo);
    const r = await uc.execute({
      id: 'p-1',
      mockSessionId: 'sess-1',
      amount: 100,
      delaySeconds: 0,
      priority: 1,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status).toBe('scheduled');
  });

  it('releases when due', async () => {
    const repo = new InMemoryPaymentSchedulerRepository();
    const schedule = new SchedulePaymentsUseCase(repo);
    const release = new ReleaseScheduledPaymentUseCase(repo);
    await schedule.execute({
      id: 'p-2',
      mockSessionId: 'sess-2',
      amount: 50,
      delaySeconds: 0,
    });
    const r = await release.execute({ id: 'p-2', now: new Date(Date.now() + 1000) });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status).toBe('released');
  });

  it('rejects release when not due', async () => {
    const repo = new InMemoryPaymentSchedulerRepository();
    const schedule = new SchedulePaymentsUseCase(repo);
    const release = new ReleaseScheduledPaymentUseCase(repo);
    await schedule.execute({
      id: 'p-3',
      mockSessionId: 'sess-3',
      amount: 10,
      delaySeconds: 3600,
    });
    const r = await release.execute({ id: 'p-3' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('NOT_DUE');
  });
});
