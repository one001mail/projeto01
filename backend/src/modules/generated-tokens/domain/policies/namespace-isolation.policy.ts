/**
 * NamespaceIsolationPolicy.
 *
 * Decides whether two tokens belong to the same namespace, used by the
 * read-side use cases to enforce namespace-scoped lookups in the future
 * and to reject leakage between unrelated sandbox contexts. Pure.
 */
import type { TokenNamespace } from '../value-objects/token-namespace.vo.js';

export const NamespaceIsolationPolicy = {
  sameNamespace(a: TokenNamespace, b: TokenNamespace): boolean {
    return a.equals(b);
  },
} as const;
