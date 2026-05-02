export const LOGS_MINIMIZED_EVENT = 'log-minimizer.logs-minimized';

export interface LogsMinimizedPayload {
  readonly scope: string;
  readonly removedCount: number;
  readonly cutoff: string;
  readonly mock: true;
}
