/**
 * Pure test doubles.
 *
 * Intended for test files (vitest). No framework imports — this file is
 * subject to the `shared-application` boundary rules and must stay pure
 * (no fastify / pg / ioredis). Framework-level fixtures such as a test
 * Fastify app are defined inline in the test file that needs them.
 */
import { FixedClock } from '../ports/clock.port.js';
import type {
  QueryRunner,
  TransactionManager,
  TransactionOptions,
} from '../ports/transaction-manager.port.js';
import { SequentialUuidGenerator } from '../ports/uuid.port.js';

/** Transaction manager that runs `fn` with a stub runner and counts lifecycle events. */
export class FakeTransactionManager implements TransactionManager {
  public beginCount = 0;
  public commitCount = 0;
  public rollbackCount = 0;
  private readonly runner: QueryRunner = {
    async query() {
      return { rows: [], rowCount: 0 };
    },
  };

  async runInTransaction<T>(
    fn: (runner: QueryRunner) => Promise<T>,
    _options?: TransactionOptions,
  ): Promise<T> {
    this.beginCount += 1;
    try {
      const result = await fn(this.runner);
      this.commitCount += 1;
      return result;
    } catch (err) {
      this.rollbackCount += 1;
      throw err;
    }
  }

  getCurrentRunner(): QueryRunner {
    return this.runner;
  }
}

export interface RecordedOutboxEvent {
  id: string;
  name: string;
  occurredAt: string;
  aggregateId?: string | undefined;
  payload: unknown;
  usedRunner: boolean;
}

/** Outbox store double that records every `save()` call. */
export class FakeOutboxStore {
  public readonly events: RecordedOutboxEvent[] = [];

  async save(
    event: {
      id: string;
      name: string;
      occurredAt: string;
      payload: unknown;
      aggregateId?: string;
    },
    runner?: QueryRunner,
  ): Promise<string> {
    this.events.push({
      id: event.id,
      name: event.name,
      occurredAt: event.occurredAt,
      aggregateId: event.aggregateId,
      payload: event.payload,
      usedRunner: runner !== undefined,
    });
    return event.id;
  }
}

export function makeFixedClock(iso = '2025-07-01T12:00:00.000Z'): FixedClock {
  return new FixedClock(new Date(iso));
}

export function makeUuidGen(): SequentialUuidGenerator {
  return new SequentialUuidGenerator();
}
