/**
 * Get Learning Session use case.
 *
 * Pure read path. Looks up by public code and returns a plain DTO or a
 * NOT_FOUND error. No transactions (read-consistent view from the pool
 * runner is sufficient for this sandbox).
 */
import { type Err, type Ok, err, ok } from '../../../shared/types/result.js';
import type { LearningSessionProps } from '../domain/learning-session.entity.js';
import type { LearningSessionRepository } from '../domain/learning-session.repository.js';
import { isValidPublicCode } from '../domain/public-code.js';

export interface GetLearningSessionInput {
  publicCode: string;
}

export type GetLearningSessionError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'NOT_FOUND'; message: string };

export class GetLearningSessionUseCase {
  constructor(private readonly repo: LearningSessionRepository) {}

  async execute(
    input: GetLearningSessionInput,
  ): Promise<Ok<LearningSessionProps> | Err<GetLearningSessionError>> {
    const code = input.publicCode.trim();
    if (!isValidPublicCode(code)) {
      return err({ kind: 'INVALID_INPUT', message: 'public_code is malformed' });
    }
    const session = await this.repo.findByPublicCode(code);
    if (!session) {
      return err({
        kind: 'NOT_FOUND',
        message: `No learning session with public_code '${code}'`,
      });
    }
    return ok(session.toJSON());
  }
}
