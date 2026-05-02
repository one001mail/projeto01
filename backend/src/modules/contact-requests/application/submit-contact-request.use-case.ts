/**
 * Submit Contact Request use case.
 *
 * Persists the request + emits a `contact-requests.submitted` outbox event
 * inside a single transaction. Surfaces `INVALID_INPUT` for any factory-
 * rejected aggregate; structural validation happens earlier at the HTTP
 * layer via Zod.
 */
import type { Clock } from '../../../shared/application/ports/clock.port.js';
import type {
  QueryRunner,
  TransactionManager,
} from '../../../shared/application/ports/transaction-manager.port.js';
import type { UuidGenerator } from '../../../shared/application/ports/uuid.port.js';
import { type Err, type Ok, err, ok } from '../../../shared/types/result.js';
import { ContactRequest, type ContactRequestProps } from '../domain/contact-request.entity.js';
import type { ContactRequestRepository } from '../domain/contact-request.repository.js';

export interface SubmitContactRequestInput {
  name: string;
  email: string;
  subject?: string | null;
  message: string;
}

export type SubmitContactRequestError = { kind: 'INVALID_INPUT'; message: string };

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

export interface SubmitContactRequestDeps {
  repo: ContactRequestRepository;
  tm: TransactionManager;
  outbox: OutboxSaver;
  clock: Clock;
  uuid: UuidGenerator;
}

export class SubmitContactRequestUseCase {
  constructor(private readonly deps: SubmitContactRequestDeps) {}

  async execute(
    input: SubmitContactRequestInput,
  ): Promise<Ok<ContactRequestProps> | Err<SubmitContactRequestError>> {
    const { repo, tm, outbox, clock, uuid } = this.deps;
    const now = clock.now();

    let entity: ContactRequest;
    try {
      entity = ContactRequest.create({
        id: uuid.v4(),
        name: input.name,
        email: input.email,
        subject: input.subject ?? null,
        message: input.message,
        createdAt: now,
      });
    } catch (e) {
      return err({
        kind: 'INVALID_INPUT',
        message: e instanceof Error ? e.message : 'invalid input',
      });
    }

    const props = await tm.runInTransaction(async (runner) => {
      await repo.save(entity);
      await outbox.save(
        {
          id: uuid.v4(),
          name: 'contact-requests.submitted',
          occurredAt: now.toISOString(),
          aggregateId: entity.id,
          payload: {
            id: entity.id,
            email: entity.email,
            subjectPresent: entity.subject !== null,
            messageLength: entity.message.length,
            createdAt: entity.createdAt.toISOString(),
          },
        },
        runner,
      );
      return entity.toJSON();
    });

    return ok(props);
  }
}
