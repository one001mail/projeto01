/**
 * Payment Scheduler module — SANDBOX-ONLY.
 *
 * Schedules MOCK educational events only. No real payouts, no payment
 * broadcast, no wallet integration, no funds transfer.
 */
import type { FastifyInstance } from 'fastify';
import { ReleaseScheduledPaymentUseCase } from './application/use-cases/release-scheduled-payment.use-case.js';
import { ReschedulePaymentUseCase } from './application/use-cases/reschedule-payment.use-case.js';
import { SchedulePaymentsUseCase } from './application/use-cases/schedule-payments.use-case.js';
import { InMemoryPaymentSchedulerRepository } from './infra/persistence/in-memory-payment-scheduler.repository.js';

export interface PaymentSchedulerModule {
  readonly name: 'payment-scheduler';
  readonly schedule: SchedulePaymentsUseCase;
  readonly release: ReleaseScheduledPaymentUseCase;
  readonly reschedule: ReschedulePaymentUseCase;
  readonly repository: InMemoryPaymentSchedulerRepository;
}

export async function registerPaymentSchedulerModule(app: FastifyInstance): Promise<void> {
  const repository = new InMemoryPaymentSchedulerRepository();
  const module: PaymentSchedulerModule = {
    name: 'payment-scheduler',
    schedule: new SchedulePaymentsUseCase(repository),
    release: new ReleaseScheduledPaymentUseCase(repository),
    reschedule: new ReschedulePaymentUseCase(repository),
    repository,
  };
  (app as unknown as { paymentScheduler?: PaymentSchedulerModule }).paymentScheduler = module;
  app.log.debug(
    { module: 'payment-scheduler', sandbox: true, mockOnly: true },
    'payment-scheduler module ready (MOCK, NO REAL PAYOUTS)',
  );
}
