import type { SagaStatus } from '../value-objects/saga-status.js';

/**
 * Compensation policy: any non-terminal status may be compensated to FAILED.
 * Terminal statuses (COMPLETED, FAILED) are immutable.
 */
export function canCompensate(status: SagaStatus): boolean {
  return status !== 'COMPLETED' && status !== 'FAILED';
}
