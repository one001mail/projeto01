/**
 * Health presenter.
 *
 * Maps the controller's domain-level result onto the public HTTP response.
 * Today the shapes are 1:1, but keeping the indirection lets us evolve the
 * controller (add internal fields) without breaking the public contract.
 */
import type { HealthCheckResult } from '../controllers/health.controller.js';
import type { HealthResponse } from '../schemas/health.schemas.js';

export function presentHealth(result: HealthCheckResult): HealthResponse {
  return {
    status: result.status,
    uptimeSeconds: result.uptimeSeconds,
    timestamp: result.timestamp,
    version: result.version,
    checks: {
      process: result.checks.process,
      postgres: result.checks.postgres,
      redis: result.checks.redis,
    },
  };
}
