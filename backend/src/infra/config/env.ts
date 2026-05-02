/**
 * Infra config re-exports.
 *
 * The canonical Config lives at `src/app/config.ts`. This module re-exports
 * grouped views of it so infra consumers can depend on a narrow shape
 * (e.g. only database config) without importing the full app config.
 *
 * Rationale: the boundary checker allows `infra -> app` solely for config
 * access. Keeping those slices thin reduces coupling.
 */
export {
  type Config,
  loadConfig,
} from '../../app/config.js';
