/**
 * Create Learning Session use case.
 *
 * Orchestration only: generates identifiers via the UUID port, builds a
 * PublicCode via a random source derived from the same port, persists the
 * aggregate and emits a `learning-sessions.created` event through the
 * outbox — all inside a single transaction so partial writes are impossible.
 */
import type { Clock } from '../../../shared/application/ports/clock.port.js';
import type {
  QueryRunner,
  TransactionManager,
} from '../../../shared/application/ports/transaction-manager.port.js';
import type { UuidGenerator } from '../../../shared/application/ports/uuid.port.js';
import { type Err, type Ok, err, ok } from '../../../shared/types/result.js';
import { LearningSession, type LearningSessionProps } from '../domain/learning-session.entity.js';
import {
  LearningSessionAlreadyExistsError,
  type LearningSessionRepository,
} from '../domain/learning-session.repository.js';
import { PUBLIC_CODE_ALPHABET, generatePublicCode } from '../domain/public-code.js';

export interface CreateLearningSessionInput {
  subject?: string | null;
  inputValue?: number | null;
  /** When provided, sets `expires_at = now + expiresInSeconds`. */
  expiresInSeconds?: number | null;
}

export type CreateLearningSessionError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'COLLISION'; message: string };

export interface OutboxSaver {
  save(
    event: {
      id: string;
      name: string;
      occurredAt: string;
      payload: unknown;
      aggregateId?: string;
    },
    runner?: QueryRunner,
  ): Promise<string>;
}

export interface CreateLearningSessionDeps {
  repo: LearningSessionRepository;
  tm: TransactionManager;
  outbox: OutboxSaver;
  clock: Clock;
  uuid: UuidGenerator;
  /**
   * Returns an integer in [0, max). Defaulted in module wiring to a
   * crypto-backed implementation; tests inject deterministic sources.
   */
  random: (max: number) => number;
  /** Max attempts to generate a non-colliding publicCode. Defaults to 5. */
  publicCodeRetries?: number;
}

const MAX_PUBLIC_CODE_RETRIES = 5;

export class CreateLearningSessionUseCase {
  constructor(private readonly deps: CreateLearningSessionDeps) {}

  async execute(
    input: CreateLearningSessionInput,
  ): Promise<Ok<LearningSessionProps> | Err<CreateLearningSessionError>> {
    const { repo, tm, outbox, clock, uuid, random } = this.deps;
    const maxRetries = this.deps.publicCodeRetries ?? MAX_PUBLIC_CODE_RETRIES;

    const now = clock.now();
    const expiresAt =
      typeof input.expiresInSeconds === 'number' && input.expiresInSeconds > 0
        ? new Date(now.getTime() + input.expiresInSeconds * 1000)
        : null;

    let lastError: LearningSessionAlreadyExistsError | null = null;
    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
      const id = uuid.v4();
      const publicCode = generatePublicCode((max) => random(max));

      let session: LearningSession;
      try {
        session = LearningSession.create({
          id,
          publicCode,
          subject: input.subject ?? null,
          inputValue: input.inputValue ?? null,
          createdAt: now,
          expiresAt,
        });
      } catch (e) {
        return err({
          kind: 'INVALID_INPUT',
          message: e instanceof Error ? e.message : 'invalid input',
        });
      }

      try {
        const props = await tm.runInTransaction(async (runner) => {
          await repo.save(session);
          await outbox.save(
            {
              id: uuid.v4(),
              name: 'learning-sessions.created',
              occurredAt: now.toISOString(),
              aggregateId: session.id,
              payload: {
                id: session.id,
                publicCode: session.publicCode,
                status: session.status,
                subject: session.subject,
                inputValue: session.inputValue,
                createdAt: session.createdAt.toISOString(),
                expiresAt: session.expiresAt?.toISOString() ?? null,
              },
            },
            runner,
          );
          return session.toJSON();
        });
        return ok(props);
      } catch (e) {
        if (e instanceof LearningSessionAlreadyExistsError) {
          lastError = e;
          continue;
        }
        throw e;
      }
    }

    return err({
      kind: 'COLLISION',
      message: `Failed to generate a unique public code after ${maxRetries} attempts (alphabet=${PUBLIC_CODE_ALPHABET.length}). Last: ${lastError?.publicCode ?? 'n/a'}.`,
    });
  }
}
