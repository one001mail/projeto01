/** FIFO priority policy for sandbox reservations. */
export function allocationPriority<T extends { createdAt: Date }>(
  items: readonly T[],
): readonly T[] {
  return [...items].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
