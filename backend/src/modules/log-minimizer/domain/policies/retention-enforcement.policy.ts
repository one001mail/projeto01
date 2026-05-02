export function isPastRetention(createdAt: Date, cutoff: Date): boolean {
  return createdAt.getTime() < cutoff.getTime();
}
