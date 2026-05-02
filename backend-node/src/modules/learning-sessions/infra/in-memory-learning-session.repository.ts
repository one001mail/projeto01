/**
 * In-memory LearningSession repository.
 *
 * Used by unit tests and to keep the module self-contained when no database
 * is attached. Mirrors the semantics of the PG adapter, including the
 * unique-public-code invariant (throws `LearningSessionAlreadyExistsError`).
 */
import { LearningSession, type LearningSessionProps } from '../domain/learning-session.entity.js';
import {
  LearningSessionAlreadyExistsError,
  type LearningSessionRepository,
} from '../domain/learning-session.repository.js';

export class InMemoryLearningSessionRepository implements LearningSessionRepository {
  private readonly byId = new Map<string, LearningSessionProps>();
  private readonly byPublicCode = new Map<string, string>();

  async findByPublicCode(publicCode: string): Promise<LearningSession | null> {
    const id = this.byPublicCode.get(publicCode);
    if (!id) return null;
    const row = this.byId.get(id);
    return row ? LearningSession.restore(row) : null;
  }

  async save(session: LearningSession): Promise<void> {
    if (this.byPublicCode.has(session.publicCode)) {
      throw new LearningSessionAlreadyExistsError(session.publicCode);
    }
    const props = session.toJSON();
    this.byId.set(props.id, props);
    this.byPublicCode.set(props.publicCode, props.id);
  }

  /** Test helper. */
  reset(): void {
    this.byId.clear();
    this.byPublicCode.clear();
  }

  /** Test helper. */
  size(): number {
    return this.byId.size;
  }
}
