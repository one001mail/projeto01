/**
 * LearningSession repository PORT.
 *
 * Defined in `domain/` so application code depends only on the verb set we
 * need. Concrete adapters (pg, in-memory) live in `infra/`.
 */
import type { LearningSession } from './learning-session.entity.js';

export interface LearningSessionRepository {
  /** Returns `null` when no session with `publicCode` exists. */
  findByPublicCode(publicCode: string): Promise<LearningSession | null>;
  /** Insert-only for now. `LearningSessionAlreadyExistsError` on unique violation. */
  save(session: LearningSession): Promise<void>;
}

export class LearningSessionAlreadyExistsError extends Error {
  constructor(public readonly publicCode: string) {
    super(`LearningSession with public_code '${publicCode}' already exists`);
    this.name = 'LearningSessionAlreadyExistsError';
  }
}
