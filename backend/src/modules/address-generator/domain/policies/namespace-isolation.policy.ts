/**
 * Namespace-isolation policy.
 *
 * Ensures that address tokens from different namespaces cannot be
 * cross-referenced. Logical rule: two tokens are isolated iff their
 * namespaces differ.
 */
export function areNamespacesIsolated(a: string, b: string): boolean {
  return a !== b;
}
