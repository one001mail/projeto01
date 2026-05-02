export function isDelayPositive(seconds: number): boolean {
  return Number.isInteger(seconds) && seconds >= 0;
}
