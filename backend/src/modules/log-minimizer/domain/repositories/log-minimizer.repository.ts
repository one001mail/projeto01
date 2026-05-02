import type { LogPolicy } from '../entities/log-policy.entity.js';

export interface LogRecord {
  readonly id: string;
  readonly scope: string;
  readonly payload: unknown;
  readonly createdAt: Date;
}

export interface LogMinimizerRepository {
  savePolicy(p: LogPolicy): Promise<void>;
  findPolicy(id: string): Promise<LogPolicy | null>;
  /**
   * Remove log records older than `cutoff` within the given scope.
   * Returns the number of removed entries.
   */
  removeOlderThan(scope: string, cutoff: Date): Promise<number>;
  /** Test-helper seed for in-memory fakes. */
  seedRecord?(r: LogRecord): Promise<void>;
}
