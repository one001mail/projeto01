import { describe, expect, it, vi } from 'vitest';
import { createSchedulerWorker } from './scheduler-worker.js';

describe('scheduler worker', () => {
  it('throws when intervalMs <= 0', () => {
    expect(() =>
      createSchedulerWorker({
        name: 'bad',
        intervalMs: 0,
        tick: async () => undefined,
      }),
    ).toThrow(/intervalMs must be > 0/);
  });

  it('runs ticks on the configured interval and stops cleanly', async () => {
    vi.useFakeTimers();
    try {
      let ticks = 0;
      const worker = createSchedulerWorker({
        name: 'unit',
        intervalMs: 50,
        tick: async () => {
          ticks += 1;
        },
      });

      expect(worker.isRunning).toBe(false);
      worker.start();
      expect(worker.isRunning).toBe(true);

      await vi.advanceTimersByTimeAsync(50);
      await vi.advanceTimersByTimeAsync(50);
      await vi.advanceTimersByTimeAsync(50);

      expect(ticks).toBe(3);

      await worker.stop();
      expect(worker.isRunning).toBe(false);

      await vi.advanceTimersByTimeAsync(200);
      expect(ticks).toBe(3); // no more ticks after stop
    } finally {
      vi.useRealTimers();
    }
  });

  it('fires immediately when runOnStart=true', async () => {
    vi.useFakeTimers();
    try {
      let ticks = 0;
      const worker = createSchedulerWorker({
        name: 'boot',
        intervalMs: 1_000,
        runOnStart: true,
        tick: async () => {
          ticks += 1;
        },
      });
      worker.start();
      await vi.advanceTimersByTimeAsync(0);
      expect(ticks).toBe(1);
      await worker.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it('start() is idempotent', async () => {
    vi.useFakeTimers();
    try {
      let ticks = 0;
      const worker = createSchedulerWorker({
        name: 'dup',
        intervalMs: 100,
        tick: async () => {
          ticks += 1;
        },
      });
      worker.start();
      worker.start();
      worker.start();
      await vi.advanceTimersByTimeAsync(100);
      expect(ticks).toBe(1); // only one interval active
      await worker.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it('skips overlapping ticks when the previous one is still in flight', async () => {
    vi.useFakeTimers();
    try {
      let enters = 0;
      let release: (() => void) | null = null;
      const worker = createSchedulerWorker({
        name: 'slow',
        intervalMs: 10,
        tick: () =>
          new Promise<void>((resolve) => {
            enters += 1;
            release = resolve as () => void;
          }),
      });

      worker.start();
      // Fire two timer cycles while the first tick is still waiting for release.
      await vi.advanceTimersByTimeAsync(10);
      await vi.advanceTimersByTimeAsync(10);
      await vi.advanceTimersByTimeAsync(10);
      expect(enters).toBe(1);

      // Release the slow tick and let the next one run.
      (release as unknown as () => void)?.();
      await vi.advanceTimersByTimeAsync(10);
      expect(enters).toBe(2);

      (release as unknown as () => void)?.();
      await worker.stop();
    } finally {
      vi.useRealTimers();
    }
  });

  it('swallows errors thrown inside the tick', async () => {
    vi.useFakeTimers();
    try {
      let ticks = 0;
      const worker = createSchedulerWorker({
        name: 'err',
        intervalMs: 20,
        tick: async () => {
          ticks += 1;
          throw new Error('tick boom');
        },
      });
      worker.start();
      await vi.advanceTimersByTimeAsync(20);
      await vi.advanceTimersByTimeAsync(20);
      expect(ticks).toBe(2);
      await worker.stop();
    } finally {
      vi.useRealTimers();
    }
  });
});
