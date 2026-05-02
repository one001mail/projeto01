/**
 * Narrow app-config slice: host/port/env/logging.
 */
import type { Config } from '../../app/config.js';

export interface AppConfig {
  readonly env: Config['NODE_ENV'];
  readonly host: string;
  readonly port: number;
  readonly logLevel: Config['LOG_LEVEL'];
  readonly sandboxOnly: boolean;
}

export function toAppConfig(config: Config): AppConfig {
  return {
    env: config.NODE_ENV,
    host: config.HOST,
    port: config.PORT,
    logLevel: config.LOG_LEVEL,
    sandboxOnly: config.SANDBOX_ONLY,
  };
}
