import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import type { PaymentSchedulerRepository } from '../../domain/repositories/payment-scheduler.repository.js';
import { PaymentSchedulingService } from '../../domain/services/payment-scheduling.service.js';

export interface SchedulePaymentsCommand {
  readonly id: string;
  readonly mockSessionId: string;
  readonly amount: number;
  readonly delaySeconds: number;
  readonly priority?: number;
}
export type SchedulePaymentsError = { kind: 'INVALID_INPUT'; message: string };

export class SchedulePaymentsUseCase {
  constructor(
    private readonly repo: PaymentSchedulerRepository,
    private readonly svc: PaymentSchedulingService = new PaymentSchedulingService(),
  ) {}
  async execute(
    cmd: SchedulePaymentsCommand,
  ): Promise<Ok<{ id: string; status: string; scheduledAt: string }> | Err<SchedulePaymentsError>> {
    try {
      const p = this.svc.schedule(cmd);
      await this.repo.save(p);
      return ok({ id: p.id, status: p.status, scheduledAt: p.scheduledAt.toISOString() });
    } catch (e) {
      return err({ kind: 'INVALID_INPUT', message: e instanceof Error ? e.message : 'invalid' });
    }
  }
}
