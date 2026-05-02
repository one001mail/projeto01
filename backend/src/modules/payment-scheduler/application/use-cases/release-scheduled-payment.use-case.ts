import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import type { PaymentSchedulerRepository } from '../../domain/repositories/payment-scheduler.repository.js';

export interface ReleaseScheduledPaymentCommand {
  readonly id: string;
  readonly now?: Date;
}
export type ReleaseScheduledPaymentError =
  | { kind: 'NOT_FOUND'; message: string }
  | { kind: 'NOT_DUE'; message: string };

export class ReleaseScheduledPaymentUseCase {
  constructor(private readonly repo: PaymentSchedulerRepository) {}
  async execute(
    cmd: ReleaseScheduledPaymentCommand,
  ): Promise<Ok<{ id: string; status: string }> | Err<ReleaseScheduledPaymentError>> {
    const p = await this.repo.findById(cmd.id);
    if (!p) return err({ kind: 'NOT_FOUND', message: 'payment not found' });
    try {
      p.release(cmd.now);
      await this.repo.save(p);
      return ok({ id: p.id, status: p.status });
    } catch (e) {
      return err({ kind: 'NOT_DUE', message: e instanceof Error ? e.message : 'not due' });
    }
  }
}
