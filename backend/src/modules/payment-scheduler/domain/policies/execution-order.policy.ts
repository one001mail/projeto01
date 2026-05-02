export function byPriorityDesc<T extends { priority: number }>(items: readonly T[]): readonly T[] {
  return [...items].sort((a, b) => b.priority - a.priority);
}
