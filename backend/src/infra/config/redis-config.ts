/**
 * Narrow Redis-config slice.
 */
import type { Config } from '../../app/config.js';

export interface RedisConfig {
  readonly url: string;
}

export function toRedisConfig(config: Config): RedisConfig {
  return { url: config.REDIS_URL };
}
