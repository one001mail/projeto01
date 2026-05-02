import type { ScheduledPayment } from '../../domain/entities/scheduled-payment.entity.js';
import type { PaymentSchedulerRepository } from '../../domain/repositories/payment-scheduler.repository.js';

export class InMemoryPaymentSchedulerRepository implements PaymentSchedulerRepository {
  private readonly store = new Map<string, ScheduledPayment>();
  async save(p: ScheduledPayment): Promise<void> {
    this.store.set(p.id, p);
  }
  async findById(id: string): Promise<ScheduledPayment | null> {
    return this.store.get(id) ?? null;
  }
  async listDue(now: Date, limit: number): Promise<readonly ScheduledPayment[]> {
    return [...this.store.values()]
      .filter((p) => p.status === 'scheduled' && p.scheduledAt.getTime() <= now.getTime())
      .slice(0, limit);
  }
  reset(): void {
    this.store.clear();
  }
}
