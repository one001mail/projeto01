/**
 * Schedule-payments job definition — SANDBOX / MOCK ONLY.
 *
 * DOES NOT move money, DOES NOT broadcast transactions, DOES NOT talk to
 * any wallet or payment processor. The handler only writes mock
 * educational records. Architectural-parity stub with the MASTER PROMPT.
 */
export interface SchedulePaymentsJobInput {
  readonly now?: Date;
}

export const schedulePaymentsJob = {
  name: 'schedule-payments' as const,
  sandbox: true as const,
  async handle(
    _input: SchedulePaymentsJobInput,
  ): Promise<{ scheduled: number; mock: true; notAPayout: true }> {
    return { scheduled: 0, mock: true as const, notAPayout: true as const };
  },
};
