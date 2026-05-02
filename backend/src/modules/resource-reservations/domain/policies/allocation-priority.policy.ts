/**
 * AllocationPriorityPolicy.
 *
 * Decides ordering when multiple namespaces compete for a shared cap.
 * Pure rule: lexicographic on namespace, oldest reservation wins on ties.
 */
import type { AllocationId } from '../value-objects/allocation-id.vo.js';

export interface PriorityCandidate {
  readonly namespace: AllocationId;
  readonly createdAt: Date;
}

export const AllocationPriorityPolicy = {
  compare(a: PriorityCandidate, b: PriorityCandidate): number {
    const byName = a.namespace.toString().localeCompare(b.namespace.toString());
    if (byName !== 0) return byName;
    return a.createdAt.getTime() - b.createdAt.getTime();
  },
} as const;
