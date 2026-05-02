export function reachesThreshold(confirmations: number, threshold: number): boolean {
  return confirmations >= threshold;
}
