import { describe, expect, it } from 'vitest';
import { ApplyLogPolicyUseCase } from './application/use-cases/apply-log-policy.use-case.js';
import { CleanupExpiredLogsUseCase } from './application/use-cases/cleanup-expired-logs.use-case.js';
import { MinimizeLogPayloadUseCase } from './application/use-cases/minimize-log-payload.use-case.js';
import { InMemoryLogMinimizerRepository } from './infra/persistence/in-memory-log-minimizer.repository.js';

describe('log-minimizer (privacy-by-design)', () => {
  it('redacts fields by path', async () => {
    const uc = new MinimizeLogPayloadUseCase();
    const r = await uc.execute({
      payload: { email: 'x@y.z', safe: 'ok' },
      redactPaths: ['email'],
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.value as { email: string }).email).toBe('<redacted>');
  });

  it('cleans logs older than cutoff', async () => {
    const repo = new InMemoryLogMinimizerRepository();
    await repo.seedRecord({
      id: '1',
      scope: 'audit',
      payload: {},
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
    });
    await repo.seedRecord({
      id: '2',
      scope: 'audit',
      payload: {},
      createdAt: new Date(),
    });
    const cleanup = new CleanupExpiredLogsUseCase(repo);
    const res = await cleanup.execute({ scope: 'audit', retentionDays: 7 });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.removedCount).toBe(1);
  });

  it('applies a policy', async () => {
    const repo = new InMemoryLogMinimizerRepository();
    const apply = new ApplyLogPolicyUseCase(repo);
    const r = await apply.execute({ id: 'p-1', scope: 'audit', retentionDays: 7, redactPaths: [] });
    expect(r.ok).toBe(true);
  });
});
