/**
 * Admin health presenter.
 */
import type { AdminHealthResult } from '../controllers/admin-health.controller.js';
import type { AdminHealthResponse } from '../schemas/admin-health.schemas.js';

export function presentAdminHealth(result: AdminHealthResult): AdminHealthResponse {
  return {
    status: result.status,
    uptimeSeconds: result.uptimeSeconds,
    timestamp: result.timestamp,
    version: result.version,
    node: { ...result.node },
    checks: { ...result.checks },
    modules: [...result.modules],
    config: { ...result.config },
  };
}
