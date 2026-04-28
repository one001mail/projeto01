/**
 * Clock port.
 *
 * All time-dependent code reads `now()` through this port so tests can
 * inject a fixed instant. The default adapter delegates to `Date.now()`.
 */
export interface Clock {
  now(): Date;
  nowMs(): number;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
  nowMs(): number {
    return Date.now();
  }
}

export class FixedClock implements Clock {
  constructor(private instant: Date) {}
  now(): Date {
    return new Date(this.instant);
  }
  nowMs(): number {
    return this.instant.getTime();
  }
  set(instant: Date): void {
    this.instant = instant;
  }
  advance(ms: number): void {
    this.instant = new Date(this.instant.getTime() + ms);
  }
}
