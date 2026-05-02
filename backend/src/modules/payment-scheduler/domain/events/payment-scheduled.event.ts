export const PAYMENT_SCHEDULED_EVENT = 'payment-scheduler.payment-scheduled';
export interface PaymentScheduledPayload {
  readonly paymentId: string;
  readonly mockSessionId: string;
  readonly amount: number;
  readonly scheduledAt: string;
  readonly mock: true;
  readonly notAPayout: true;
}
