export function withinPaymentWindow(at: Date, start: Date, end: Date): boolean {
  return at.getTime() >= start.getTime() && at.getTime() <= end.getTime();
}
