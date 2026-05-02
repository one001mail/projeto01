/**
 * Narrow DB-config slice for infra consumers.
 */
import type { Config } from '../../app/config.js';

export interface DbConfig {
  readonly url: string;
  readonly poolMax: number;
  readonly idleTimeoutMs: number;
}

export function toDbConfig(config: Config): DbConfig {
  return {
    url: config.DATABASE_URL,
    poolMax: config.PG_POOL_MAX,
    idleTimeoutMs: config.PG_IDLE_TIMEOUT_MS,
  };
}
