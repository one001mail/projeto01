/**
 * Expire-sessions job definition.
 *
 * Registers a background job that marks MOCK learning sessions as expired
 * when their `expiresAt` is in the past. Safe, sandbox-only. The actual
 * wiring is handled by the learning-sessions module's scheduler-worker.
 */
export interface ExpireSessionsJobInput {
  readonly now?: Date;
}

export const expireSessionsJob = {
  name: 'expire-sessions' as const,
  /**
   * Default no-op handler. The learning-sessions module swaps this for a
   * real handler at registration time; this default exists so the job
   * registry is never missing a named handler.
   */
  async handle(_input: ExpireSessionsJobInput): Promise<{ executedAt: string }> {
    return { executedAt: new Date().toISOString() };
  },
};
