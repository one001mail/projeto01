import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { registerErrorHandler } from '../../api/http/error-handler.js';
import {
  FakeOutboxStore,
  FakeTransactionManager,
  makeFixedClock,
  makeUuidGen,
} from '../../shared/application/testing/fakes.js';
import { SubmitContactRequestUseCase } from './application/submit-contact-request.use-case.js';
import { makeContactRequestsRoutes } from './infra/http/routes.js';
import { InMemoryContactRequestRepository } from './infra/in-memory-contact-request.repository.js';

async function buildTestApp() {
  const app = Fastify({ logger: false });
  registerErrorHandler(app);
  return app;
}

describe('submit-contact-request use case', () => {
  it('persists and emits a privacy-redacted outbox event', async () => {
    const repo = new InMemoryContactRequestRepository();
    const tm = new FakeTransactionManager();
    const outbox = new FakeOutboxStore();
    const uc = new SubmitContactRequestUseCase({
      repo,
      tm,
      outbox,
      clock: makeFixedClock(),
      uuid: makeUuidGen(),
    });

    const result = await uc.execute({
      name: '  Ada  ',
      email: 'Ada@Example.COM',
      subject: ' help ',
      message: 'hello world',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');

    expect(result.value.name).toBe('Ada');
    expect(result.value.email).toBe('ada@example.com');
    expect(result.value.subject).toBe('help');
    expect(result.value.status).toBe('received');

    expect(tm.beginCount).toBe(1);
    expect(tm.commitCount).toBe(1);
    expect(repo.size()).toBe(1);

    expect(outbox.events).toHaveLength(1);
    const event = outbox.events[0];
    if (!event) throw new Error('outbox event missing');
    expect(event.name).toBe('contact-requests.submitted');
    const payload = event.payload as {
      id: string;
      email: string;
      subjectPresent: boolean;
      messageLength: number;
    };
    // Message body must NOT leak into the event payload.
    expect(payload).not.toHaveProperty('message');
    expect(payload).not.toHaveProperty('name');
    expect(payload.messageLength).toBe('hello world'.length);
    expect(payload.subjectPresent).toBe(true);
  });

  it('returns INVALID_INPUT for invalid emails', async () => {
    const repo = new InMemoryContactRequestRepository();
    const uc = new SubmitContactRequestUseCase({
      repo,
      tm: new FakeTransactionManager(),
      outbox: new FakeOutboxStore(),
      clock: makeFixedClock(),
      uuid: makeUuidGen(),
    });
    const result = await uc.execute({
      name: 'Ada',
      email: 'not-an-email',
      message: 'test',
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('unreachable');
    expect(result.error.kind).toBe('INVALID_INPUT');
    expect(repo.size()).toBe(0);
  });
});

describe('contact-requests HTTP route', () => {
  async function build() {
    const repo = new InMemoryContactRequestRepository();
    const tm = new FakeTransactionManager();
    const outbox = new FakeOutboxStore();
    const submitUc = new SubmitContactRequestUseCase({
      repo,
      tm,
      outbox,
      clock: makeFixedClock(),
      uuid: makeUuidGen(),
    });

    const app = await buildTestApp();
    await app.register(
      async (api) => {
        await api.register(makeContactRequestsRoutes({ submitUc }));
      },
      { prefix: '/api' },
    );
    await app.ready();
    return { app, repo, outbox };
  }

  it('POST /api/contact-requests returns 201 with non-sensitive envelope', async () => {
    const { app, repo } = await build();
    try {
      const res = await app.inject({
        method: 'POST',
        url: '/api/contact-requests',
        payload: { name: 'Ada', email: 'ada@example.com', message: 'hi' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json() as { request: { id: string; status: string; createdAt: string } };
      expect(body.request.status).toBe('received');
      expect(body.request.id).toMatch(/^[0-9a-f-]{36}$/i);
      // Submitted body is NOT echoed.
      expect(body).not.toHaveProperty('name');
      expect(body).not.toHaveProperty('message');
      expect(repo.size()).toBe(1);
    } finally {
      await app.close();
    }
  });

  it('POST /api/contact-requests returns 422 when required fields are missing', async () => {
    const { app } = await build();
    try {
      const res = await app.inject({
        method: 'POST',
        url: '/api/contact-requests',
        payload: { name: 'Ada' },
      });
      expect(res.statusCode).toBe(422);
      const body = res.json() as { error: { code: string } };
      expect(body.error.code).toBe('VALIDATION_FAILED');
    } finally {
      await app.close();
    }
  });

  it('POST /api/contact-requests rejects unknown body keys (strict schema)', async () => {
    const { app } = await build();
    try {
      const res = await app.inject({
        method: 'POST',
        url: '/api/contact-requests',
        payload: {
          name: 'Ada',
          email: 'ada@example.com',
          message: 'hi',
          extraneous: 'field',
        },
      });
      expect(res.statusCode).toBe(422);
    } finally {
      await app.close();
    }
  });
});
