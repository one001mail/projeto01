import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { registerErrorHandler } from '../../api/http/error-handler.js';
import {
  FakeOutboxStore,
  FakeTransactionManager,
  makeFixedClock,
  makeUuidGen,
} from '../../shared/application/testing/fakes.js';
import { CreateLearningSessionUseCase } from './application/create-learning-session.use-case.js';
import { GetLearningSessionUseCase } from './application/get-learning-session.use-case.js';
import { LearningSession } from './domain/learning-session.entity.js';
import { LearningSessionAlreadyExistsError } from './domain/learning-session.repository.js';
import { PUBLIC_CODE_ALPHABET, PUBLIC_CODE_LENGTH } from './domain/public-code.js';
import { makeLearningSessionsRoutes } from './infra/http/routes.js';
import { InMemoryLearningSessionRepository } from './infra/in-memory-learning-session.repository.js';

function seededRandom(seed: number) {
  let s = seed;
  return (max: number): number => {
    s = (s * 9301 + 49297) % 233280;
    return Math.abs(s) % max;
  };
}

async function buildTestApp() {
  const app = Fastify({ logger: false });
  registerErrorHandler(app);
  return app;
}

describe('create-learning-session use case', () => {
  it('persists and emits an outbox event in a single transaction', async () => {
    const repo = new InMemoryLearningSessionRepository();
    const tm = new FakeTransactionManager();
    const outbox = new FakeOutboxStore();
    const clock = makeFixedClock();
    const uuid = makeUuidGen();
    const uc = new CreateLearningSessionUseCase({
      repo,
      tm,
      outbox,
      clock,
      uuid,
      random: seededRandom(42),
    });

    const result = await uc.execute({
      subject: 'compound interest demo',
      inputValue: 1000,
      expiresInSeconds: 3600,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');
    expect(result.value.publicCode).toHaveLength(PUBLIC_CODE_LENGTH);
    for (const ch of result.value.publicCode) {
      expect(PUBLIC_CODE_ALPHABET).toContain(ch);
    }
    expect(result.value.status).toBe('pending');
    expect(result.value.subject).toBe('compound interest demo');
    expect(result.value.inputValue).toBe(1000);
    expect(result.value.expiresAt).not.toBeNull();

    expect(tm.beginCount).toBe(1);
    expect(tm.commitCount).toBe(1);
    expect(tm.rollbackCount).toBe(0);
    expect(repo.size()).toBe(1);

    expect(outbox.events).toHaveLength(1);
    const event = outbox.events[0];
    if (!event) throw new Error('outbox event missing');
    expect(event.name).toBe('learning-sessions.created');
    expect(event.aggregateId).toBe(result.value.id);
    expect(event.usedRunner).toBe(true);
    const payload = event.payload as { publicCode: string; subject: string };
    expect(payload.publicCode).toBe(result.value.publicCode);
  });

  it('returns INVALID_INPUT when subject exceeds the max length', async () => {
    const repo = new InMemoryLearningSessionRepository();
    const uc = new CreateLearningSessionUseCase({
      repo,
      tm: new FakeTransactionManager(),
      outbox: new FakeOutboxStore(),
      clock: makeFixedClock(),
      uuid: makeUuidGen(),
      random: seededRandom(1),
    });

    const result = await uc.execute({
      subject: 'x'.repeat(300),
      inputValue: null,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.error.kind).toBe('INVALID_INPUT');
    expect(repo.size()).toBe(0);
  });

  it('retries on public-code collision and eventually returns COLLISION', async () => {
    const repo = new InMemoryLearningSessionRepository();
    const tm = new FakeTransactionManager();
    const outbox = new FakeOutboxStore();
    const fixedCode = 'A'.repeat(PUBLIC_CODE_LENGTH);
    await repo.save(
      LearningSession.create({
        id: '00000000-0000-4000-8000-000000000001',
        publicCode: fixedCode,
        createdAt: new Date('2025-01-01'),
      }),
    );

    const uc = new CreateLearningSessionUseCase({
      repo,
      tm,
      outbox,
      clock: makeFixedClock(),
      uuid: makeUuidGen(),
      random: () => 0, // always index 0 => 'A'
      publicCodeRetries: 3,
    });

    const result = await uc.execute({});
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.error.kind).toBe('COLLISION');
    expect(tm.rollbackCount).toBe(3);
    expect(repo.size()).toBe(1); // still only the seed
  });

  it('propagates unknown repo errors instead of silently retrying', async () => {
    const failingRepo = {
      async findByPublicCode() {
        return null;
      },
      async save() {
        throw new Error('db exploded');
      },
    };
    const uc = new CreateLearningSessionUseCase({
      repo: failingRepo,
      tm: new FakeTransactionManager(),
      outbox: new FakeOutboxStore(),
      clock: makeFixedClock(),
      uuid: makeUuidGen(),
      random: seededRandom(7),
    });
    await expect(uc.execute({})).rejects.toThrowError(/db exploded/);
  });
});

describe('get-learning-session use case', () => {
  it('returns NOT_FOUND when no session exists with the public code', async () => {
    const repo = new InMemoryLearningSessionRepository();
    const uc = new GetLearningSessionUseCase(repo);

    const result = await uc.execute({ publicCode: 'A'.repeat(PUBLIC_CODE_LENGTH) });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.error.kind).toBe('NOT_FOUND');
  });

  it('returns INVALID_INPUT for malformed public codes', async () => {
    const repo = new InMemoryLearningSessionRepository();
    const uc = new GetLearningSessionUseCase(repo);

    const result = await uc.execute({ publicCode: 'abc' });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.error.kind).toBe('INVALID_INPUT');
  });
});

describe('LearningSessionAlreadyExistsError', () => {
  it('carries the publicCode that collided', () => {
    const err = new LearningSessionAlreadyExistsError('AAAAAAAAAA');
    expect(err.publicCode).toBe('AAAAAAAAAA');
    expect(err.name).toBe('LearningSessionAlreadyExistsError');
  });
});

describe('learning-sessions HTTP routes', () => {
  async function build() {
    const repo = new InMemoryLearningSessionRepository();
    const tm = new FakeTransactionManager();
    const outbox = new FakeOutboxStore();
    const createUc = new CreateLearningSessionUseCase({
      repo,
      tm,
      outbox,
      clock: makeFixedClock(),
      uuid: makeUuidGen(),
      random: seededRandom(123),
    });
    const getUc = new GetLearningSessionUseCase(repo);

    const app = await buildTestApp();
    await app.register(
      async (api) => {
        await api.register(makeLearningSessionsRoutes({ createUc, getUc }));
      },
      { prefix: '/api' },
    );
    await app.ready();
    return { app, repo, outbox };
  }

  it('POST /api/learning-sessions returns 201 with a session envelope', async () => {
    const { app, repo, outbox } = await build();
    try {
      const res = await app.inject({
        method: 'POST',
        url: '/api/learning-sessions',
        payload: { subject: 'demo' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json() as { session: { publicCode: string; subject: string } };
      expect(body.session.publicCode).toHaveLength(PUBLIC_CODE_LENGTH);
      expect(body.session.subject).toBe('demo');
      expect(repo.size()).toBe(1);
      expect(outbox.events).toHaveLength(1);
    } finally {
      await app.close();
    }
  });

  it('POST /api/learning-sessions returns 422 for invalid bodies (Zod)', async () => {
    const { app } = await build();
    try {
      const res = await app.inject({
        method: 'POST',
        url: '/api/learning-sessions',
        payload: { inputValue: -5 },
      });
      expect(res.statusCode).toBe(422);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe('VALIDATION_FAILED');
    } finally {
      await app.close();
    }
  });

  it('GET /api/learning-sessions/:publicCode returns 404 when not found', async () => {
    const { app } = await build();
    try {
      const res = await app.inject({
        method: 'GET',
        url: `/api/learning-sessions/${'A'.repeat(PUBLIC_CODE_LENGTH)}`,
      });
      expect(res.statusCode).toBe(404);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe('NOT_FOUND');
    } finally {
      await app.close();
    }
  });

  it('GET /api/learning-sessions/:publicCode returns the created session', async () => {
    const { app } = await build();
    try {
      const created = await app.inject({
        method: 'POST',
        url: '/api/learning-sessions',
        payload: { subject: 'round-trip' },
      });
      const publicCode = (created.json() as { session: { publicCode: string } }).session.publicCode;

      const fetched = await app.inject({
        method: 'GET',
        url: `/api/learning-sessions/${publicCode}`,
      });
      expect(fetched.statusCode).toBe(200);
      const body = fetched.json() as { session: { publicCode: string; subject: string } };
      expect(body.session.publicCode).toBe(publicCode);
      expect(body.session.subject).toBe('round-trip');
    } finally {
      await app.close();
    }
  });

  it('GET /api/learning-sessions/:publicCode returns 422 for malformed codes', async () => {
    const { app } = await build();
    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/learning-sessions/short',
      });
      expect(res.statusCode).toBe(422);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe('VALIDATION_FAILED');
    } finally {
      await app.close();
    }
  });
});
