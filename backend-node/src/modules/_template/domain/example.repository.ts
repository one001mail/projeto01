/**
 * Example repository PORT.
 *
 * Defined in `domain/` because the language ("how do we look up an Example?")
 * belongs to the domain. The concrete adapter lives in `infra/`. The
 * application layer depends only on this interface.
 */
import type { Example } from './example.entity.js';

export interface ExampleRepository {
  findById(id: string): Promise<Example | null>;
  save(example: Example): Promise<void>;
  list(limit: number): Promise<readonly Example[]>;
}
