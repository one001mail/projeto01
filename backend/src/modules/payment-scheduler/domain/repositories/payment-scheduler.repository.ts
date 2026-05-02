import type { ScheduledPayment } from '../entities/scheduled-payment.entity.js';

export interface PaymentSchedulerRepository {
  save(p: ScheduledPayment): Promise<void>;
  findById(id: string): Promise<ScheduledPayment | null>;
  listDue(now: Date, limit: number): Promise<readonly ScheduledPayment[]>;
}
