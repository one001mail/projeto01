import { describe, expect, it } from 'vitest';
import { CreateExampleUseCase } from './application/create-example.use-case.js';
import { InMemoryExampleRepository } from './infra/in-memory-example.repository.js';

describe('_template module — CreateExampleUseCase', () => {
  it('persists a valid Example and returns its id', async () => {
    const repo = new InMemoryExampleRepository();
    const uc = new CreateExampleUseCase(repo);

    const result = await uc.execute({ id: 'ex-1', name: 'hello' });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.id).toBe('ex-1');
    const list = await repo.list(10);
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe('hello');
  });

  it('returns INVALID_INPUT for empty name', async () => {
    const repo = new InMemoryExampleRepository();
    const uc = new CreateExampleUseCase(repo);
    const result = await uc.execute({ id: 'ex-2', name: '   ' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('INVALID_INPUT');
  });
});
