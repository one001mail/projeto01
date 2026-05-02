/**
 * Feature flags (sandbox).
 *
 * Centralises boolean knobs. All flags default to SAFE values (no real
 * blockchain access under any condition).
 */
import type { Config } from '../../app/config.js';

export interface FeatureFlags {
  readonly sandboxOnly: boolean;
  readonly workersEnabled: boolean;
  /**
   * Hard-locked: even if a future config toggle is introduced, this flag
   * must remain `false` for the life of the sandbox repository.
   */
  readonly realBlockchainAccess: false;
}

export function toFeatureFlags(config: Config): FeatureFlags {
  return {
    sandboxOnly: config.SANDBOX_ONLY,
    workersEnabled: config.WORKERS_ENABLED,
    realBlockchainAccess: false,
  };
}
