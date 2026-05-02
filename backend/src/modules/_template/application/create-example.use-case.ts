/**
 * Example use case.
 *
 * Application-layer orchestration: takes ports as constructor deps, performs
 * one business operation, returns a Result. No HTTP, no database, no logger.
 */
import { type Err, type Ok, err, ok } from '../../../shared/types/result.js';
import { Example } from '../domain/example.entity.js';
import type { ExampleRepository } from '../domain/example.repository.js';

export interface CreateExampleInput {
  id: string;
  name: string;
}

export type CreateExampleError = { kind: 'INVALID_INPUT'; message: string };

export class CreateExampleUseCase {
  constructor(private readonly repo: ExampleRepository) {}

  async execute(input: CreateExampleInput): Promise<Ok<{ id: string }> | Err<CreateExampleError>> {
    let entity: Example;
    try {
      entity = Example.create(input);
    } catch (e) {
      return err({
        kind: 'INVALID_INPUT',
        message: e instanceof Error ? e.message : 'invalid input',
      });
    }
    await this.repo.save(entity);
    return ok({ id: entity.id });
  }
}
