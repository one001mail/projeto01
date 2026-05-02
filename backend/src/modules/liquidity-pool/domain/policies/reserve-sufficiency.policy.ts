export function hasSufficientReserve(available: number, requested: number): boolean {
  return available >= requested && requested > 0;
}
