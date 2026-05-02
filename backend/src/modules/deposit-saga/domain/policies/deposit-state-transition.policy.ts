import type { SagaStatus } from '../value-objects/saga-status.js';

const ALLOWED: Record<SagaStatus, readonly SagaStatus[]> = {
  STARTED: ['ACCEPTED', 'FAILED'],
  ACCEPTED: ['ROUTED', 'FAILED'],
  ROUTED: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  FAILED: [],
};

export function canTransition(from: SagaStatus, to: SagaStatus): boolean {
  return (ALLOWED[from] ?? []).includes(to);
}
