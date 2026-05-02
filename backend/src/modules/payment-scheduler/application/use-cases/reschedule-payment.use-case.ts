import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import { ScheduledPayment } from '../../domain/entities/scheduled-payment.entity.js';
import type { PaymentSchedulerRepository } from '../../domain/repositories/payment-scheduler.repository.js';

export interface ReschedulePaymentCommand {
  readonly id: string;
  readonly newDelaySeconds: number;
  readonly mockSessionId: string;
  readonly amount: number;
}
export type ReschedulePaymentError = { kind: 'NOT_FOUND'; message: string };

export class ReschedulePaymentUseCase {
  constructor(private readonly repo: PaymentSchedulerRepository) {}
  async execute(
    cmd: ReschedulePaymentCommand,
  ): Promise<Ok<{ id: string; status: string }> | Err<ReschedulePaymentError>> {
    const p = await this.repo.findById(cmd.id);
    if (!p) return err({ kind: 'NOT_FOUND', message: 'payment not found' });
    const replacement = ScheduledPayment.schedule({
      id: cmd.id,
      mockSessionId: cmd.mockSessionId,
      amount: cmd.amount,
      delaySeconds: cmd.newDelaySeconds,
    });
    await this.repo.save(replacement);
    return ok({ id: replacement.id, status: replacement.status });
  }
}
