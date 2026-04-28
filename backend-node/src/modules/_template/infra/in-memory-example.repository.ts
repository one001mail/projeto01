/**
 * In-memory adapter for ExampleRepository.
 *
 * Reference adapter for tests and the template. Real modules ship a
 * Postgres-backed adapter under `infra/`. The two MUST satisfy the same
 * port; tests run against the in-memory one for speed, integration tests
 * run against the real one for fidelity.
 */
import { Example } from '../domain/example.entity.js';
import type { ExampleRepository } from '../domain/example.repository.js';

export class InMemoryExampleRepository implements ExampleRepository {
  private readonly store = new Map<string, ReturnType<Example['toJSON']>>();

  async findById(id: string): Promise<Example | null> {
    const row = this.store.get(id);
    return row ? Example.restore(row) : null;
  }

  async save(example: Example): Promise<void> {
    this.store.set(example.id, example.toJSON());
  }

  async list(limit: number): Promise<readonly Example[]> {
    return Array.from(this.store.values())
      .slice(0, Math.max(0, limit))
      .map((p) => Example.restore(p));
  }

  /** Test helper: wipes state. Not part of the port. */
  reset(): void {
    this.store.clear();
  }
}
