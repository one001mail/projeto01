/**
 * Cleanup-logs job definition.
 *
 * Retention-driven removal of audit/log records older than the configured
 * window. Privacy-by-design, NOT anti-forensic. The log-minimizer module
 * exposes the authoritative use case; this file is a registry stub.
 */
export interface CleanupLogsJobInput {
  readonly retentionDays: number;
  readonly scope?: string;
}

export const cleanupLogsJob = {
  name: 'cleanup-logs' as const,
  async handle(input: CleanupLogsJobInput): Promise<{ removed: number; scope: string }> {
    return { removed: 0, scope: input.scope ?? 'audit' };
  },
};
