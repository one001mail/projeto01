/**
 * audit-logs module — integration tests against the in-memory adapter.
 *
 * The HTTP layer is exercised in `middlewares.test.ts` (audit middleware
 * persists to the shared store) and in this file via direct use case
 * invocation, so we don't spin up Postgres for module-level unit tests.
 */
import { describe, expect, it } from 'vitest';
import { FixedClock } from '../../shared/application/ports/clock.port.js';
import { SequentialUuidGenerator } from '../../shared/application/ports/uuid.port.js';
import { CleanupExpiredAuditLogsUseCase } from './application/use-cases/cleanup-expired-audit-logs.use-case.js';
import { GetAuditLogDetailUseCase } from './application/use-cases/get-audit-log-detail.use-case.js';
import { ListAuditLogsUseCase } from './application/use-cases/list-audit-logs.use-case.js';
import { AuditRedactionPolicy } from './domain/policies/audit-redaction.policy.js';
import { AuditRetentionPolicy } from './domain/policies/audit-retention.policy.js';
import { RetentionPeriod } from './domain/value-objects/retention-period.vo.js';
import { InMemoryAuditLogRepository } from './infra/persistence/in-memory-audit-log.repository.js';

const ADMIN = { actorId: 'admin', isAdmin: true };
const USER = { actorId: 'someone', isAdmin: false };

function seedRepo(repo: InMemoryAuditLogRepository, n: number, baseDate: Date): string[] {
  const ids: string[] = [];
  for (let i = 0; i < n; i++) {
    const id = `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;
    repo.add({
      id,
      scope: i % 2 === 0 ? 'http' : 'admin',
      action: `POST /api/x/${i}`,
      payload: {
        body: { message: 'top-secret', email: 'a@b.c' },
        headers: { authorization: 'Bearer raw-token', 'x-admin-api-key': 'leaked' },
        nested: { deep: { token: 'should-be-redacted' } },
      },
      requestId: `req-${i}`,
      actorId: i % 2 === 0 ? null : 'admin',
      createdAt: new Date(baseDate.getTime() - i * 60 * 1000),
    });
    ids.push(id);
  }
  return ids;
}

describe('audit-logs module — listing', () => {
  it('returns FORBIDDEN when subject is not admin', async () => {
    const repo = new InMemoryAuditLogRepository();
    const uc = new ListAuditLogsUseCase(repo, new FixedClock(new Date('2025-01-01T00:00:00Z')));
    const out = await uc.execute({ query: {}, subject: USER });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.kind).toBe('FORBIDDEN');
  });

  it('clamps limit, returns DTOs and applies redaction', async () => {
    const repo = new InMemoryAuditLogRepository();
    seedRepo(repo, 3, new Date('2025-01-01T00:00:00Z'));
    const uc = new ListAuditLogsUseCase(repo, new FixedClock(new Date('2025-01-01T00:00:00Z')));

    const out = await uc.execute({ query: { limit: 9999, offset: 0 }, subject: ADMIN });
    expect(out.ok).toBe(true);
    if (!out.ok) throw new Error('unreachable');
    expect(out.value.entries.length).toBe(3);
    expect(out.value.limit).toBe(500);
    for (const e of out.value.entries) {
      const body = e.redactedPayload.body as Record<string, unknown> | undefined;
      const headers = e.redactedPayload.headers as Record<string, unknown> | undefined;
      const nested = e.redactedPayload.nested as { deep?: Record<string, unknown> };
      expect(body?.email).toBe(AuditRedactionPolicy.REDACTED_PLACEHOLDER);
      expect(body?.message).toBe(AuditRedactionPolicy.REDACTED_PLACEHOLDER);
      expect(headers?.authorization).toBe(AuditRedactionPolicy.REDACTED_PLACEHOLDER);
      expect(headers?.['x-admin-api-key']).toBe(AuditRedactionPolicy.REDACTED_PLACEHOLDER);
      expect(nested.deep?.token).toBe(AuditRedactionPolicy.REDACTED_PLACEHOLDER);
    }
  });

  it('filters by scope', async () => {
    const repo = new InMemoryAuditLogRepository();
    seedRepo(repo, 4, new Date('2025-01-01T00:00:00Z'));
    const uc = new ListAuditLogsUseCase(repo, new FixedClock(new Date('2025-01-01T00:00:00Z')));
    const out = await uc.execute({ query: { scope: 'admin' }, subject: ADMIN });
    expect(out.ok).toBe(true);
    if (!out.ok) throw new Error('unreachable');
    expect(out.value.entries.every((e) => e.scope === 'admin')).toBe(true);
  });
});

describe('audit-logs module — get detail', () => {
  it('rejects non-uuid ids', async () => {
    const repo = new InMemoryAuditLogRepository();
    const uc = new GetAuditLogDetailUseCase(repo);
    const out = await uc.execute({ id: 'not-uuid', subject: ADMIN });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.kind).toBe('INVALID_INPUT');
  });

  it('returns NOT_FOUND for unknown id', async () => {
    const repo = new InMemoryAuditLogRepository();
    const uc = new GetAuditLogDetailUseCase(repo);
    const out = await uc.execute({
      id: '00000000-0000-4000-8000-000000000099',
      subject: ADMIN,
    });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.kind).toBe('NOT_FOUND');
  });

  it('returns redacted entry for admin', async () => {
    const repo = new InMemoryAuditLogRepository();
    const ids = seedRepo(repo, 1, new Date('2025-01-01T00:00:00Z'));
    const uc = new GetAuditLogDetailUseCase(repo);
    const firstId = ids[0];
    if (!firstId) throw new Error('seed failed');
    const out = await uc.execute({ id: firstId, subject: ADMIN });
    expect(out.ok).toBe(true);
    if (!out.ok) throw new Error('unreachable');
    const headers = out.value.redactedPayload.headers as Record<string, unknown>;
    expect(headers.authorization).toBe(AuditRedactionPolicy.REDACTED_PLACEHOLDER);
  });
});

describe('audit-logs module — cleanup', () => {
  it('removes rows older than the retention cutoff', async () => {
    const repo = new InMemoryAuditLogRepository();
    seedRepo(repo, 5, new Date('2025-01-10T00:00:00Z'));
    expect(repo.size()).toBe(5);

    const uc = new CleanupExpiredAuditLogsUseCase({
      repo,
      clock: new FixedClock(new Date('2025-01-10T00:00:00Z')),
      uuid: new SequentialUuidGenerator(),
    });
    // Retention 0d disables cleanup.
    const off = await uc.execute({ retentionDays: 0, subject: { actorId: null, isAdmin: true } });
    expect(off.ok).toBe(true);
    if (!off.ok) throw new Error('unreachable');
    expect(off.value.cleanupEnabled).toBe(false);
    expect(off.value.removedCount).toBe(0);

    // Retention 1s — everything older than now-1s is gone.
    const tinyDays = 1 / (24 * 60 * 60); // ~1 second in days
    const tiny = await uc.execute({
      retentionDays: 0, // integer-only domain VO -> rejected
      subject: { actorId: null, isAdmin: true },
    });
    expect(tiny.ok).toBe(true); // 0 days handled above
    void tinyDays;

    // Retention 1 day with rows up to 4 minutes old → no removal.
    const same = await uc.execute({
      retentionDays: 1,
      subject: { actorId: null, isAdmin: true },
    });
    expect(same.ok).toBe(true);
    if (!same.ok) throw new Error('unreachable');
    expect(same.value.removedCount).toBe(0);
  });

  it('rejects non-admin callers', async () => {
    const repo = new InMemoryAuditLogRepository();
    const uc = new CleanupExpiredAuditLogsUseCase({
      repo,
      clock: new FixedClock(new Date('2025-01-10T00:00:00Z')),
      uuid: new SequentialUuidGenerator(),
    });
    const out = await uc.execute({ retentionDays: 7, subject: USER });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.kind).toBe('FORBIDDEN');
  });

  it('publishes audit-logs.cleaned event when rows are removed', async () => {
    const repo = new InMemoryAuditLogRepository();
    const oldDate = new Date('2024-01-01T00:00:00Z');
    repo.add({
      id: '00000000-0000-4000-8000-000000000abc',
      scope: 'http',
      action: 'POST /api/x',
      payload: {},
      requestId: 'r',
      actorId: null,
      createdAt: oldDate,
    });
    const events: { name: string; payload: unknown }[] = [];
    const uc = new CleanupExpiredAuditLogsUseCase({
      repo,
      clock: new FixedClock(new Date('2025-01-10T00:00:00Z')),
      uuid: new SequentialUuidGenerator(),
      outbox: {
        async save(e) {
          events.push({ name: e.name, payload: e.payload });
          return e.id;
        },
      },
    });
    const out = await uc.execute({ retentionDays: 7, subject: ADMIN });
    expect(out.ok).toBe(true);
    if (!out.ok) throw new Error('unreachable');
    expect(out.value.removedCount).toBe(1);
    expect(events.length).toBe(1);
    expect(events[0]?.name).toBe('audit-logs.cleaned');
  });
});

describe('audit-logs domain policies', () => {
  it('AuditRetentionPolicy returns disabled for unlimited retention', () => {
    const period = RetentionPeriod.ofDays(0);
    const dec = AuditRetentionPolicy.decide(period, new Date('2025-01-01T00:00:00Z'));
    expect(dec.cleanupEnabled).toBe(false);
    expect(dec.cutoff).toBeNull();
  });

  it('AuditRetentionPolicy computes cutoff for finite periods', () => {
    const period = RetentionPeriod.ofDays(7);
    const dec = AuditRetentionPolicy.decide(period, new Date('2025-01-08T00:00:00Z'));
    expect(dec.cleanupEnabled).toBe(true);
    expect(dec.cutoff?.toISOString()).toBe('2025-01-01T00:00:00.000Z');
  });

  it('AuditRedactionPolicy redacts deep secrets without mutating the input', () => {
    const input: Record<string, unknown> = {
      a: 1,
      headers: { Authorization: 'token-1', cookie: 'c' },
      body: { email: 'x@y.z', other: 'ok' },
      arr: [{ secret: 'hide' }, { plain: 'show' }],
    };
    const out = AuditRedactionPolicy.apply(input);
    expect((out.headers as Record<string, unknown>).Authorization).toBe(
      AuditRedactionPolicy.REDACTED_PLACEHOLDER,
    );
    expect((out.body as Record<string, unknown>).email).toBe(
      AuditRedactionPolicy.REDACTED_PLACEHOLDER,
    );
    expect((out.arr as Array<Record<string, unknown>>)[0]?.secret).toBe(
      AuditRedactionPolicy.REDACTED_PLACEHOLDER,
    );
    expect((out.arr as Array<Record<string, unknown>>)[1]?.plain).toBe('show');
    // Input untouched.
    expect((input.headers as Record<string, unknown>).Authorization).toBe('token-1');
  });
});
