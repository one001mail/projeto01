import { ScheduledPayment } from '../entities/scheduled-payment.entity.js';

export class PaymentSchedulingService {
  schedule(input: Parameters<typeof ScheduledPayment.schedule>[0]): ScheduledPayment {
    return ScheduledPayment.schedule(input);
  }
}
