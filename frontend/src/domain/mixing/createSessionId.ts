/** Generate a unique simulated session ID */
export function createSessionId(): string {
  return `MIX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
