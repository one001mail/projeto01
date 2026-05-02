/**
 * Narrow rate-limit-config slice.
 */
import type { Config } from '../../app/config.js';

export interface RateLimitConfig {
  readonly max: number;
  readonly window: string;
}

export function toRateLimitConfig(config: Config): RateLimitConfig {
  return { max: config.RATE_LIMIT_MAX, window: config.RATE_LIMIT_WINDOW };
}
