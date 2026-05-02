/**
 * Background workers lifecycle (F4).
 *
 * Centralises start/stop of every background worker the app runs: the
 * outbox dispatcher today, more sweepers later (idempotency, retention,
 * scheduler jobs). Fully opt-in via `Config.WORKERS_ENABLED`.
 *
 * The module is wired from `build-app.ts` so workers share the same
 * `AppContext` as HTTP routes and terminate cleanly on Fastify `onClose`.
 */
import type { FastifyInstance } from 'fastify';
import { createOutboxDispatcher } from '../infra/events/outbox-dispatcher.js';
import { registerEventHandlers } from '../infra/events/register-event-handlers.js';
import type { EventHandlerRegistration } from '../infra/events/register-event-handlers.js';
import { type SchedulerWorker, createSchedulerWorker } from '../infra/queue/scheduler-worker.js';

export interface WorkersHandle {
  readonly workers: readonly SchedulerWorker[];
  stop(): Promise<void>;
}

/**
 * Collector passed to each module so it can declare event handlers without
 * knowing about the inbox guard or the event bus directly.
 */
export interface EventHandlerRegistry {
  add(registration: EventHandlerRegistration): void;
}

export function createEventHandlerRegistry(): {
  registry: EventHandlerRegistry;
  registrations: EventHandlerRegistration[];
} {
  const registrations: EventHandlerRegistration[] = [];
  return {
    registrations,
    registry: {
      add(registration): void {
        registrations.push(registration);
      },
    },
  };
}

export interface StartWorkersDeps {
  app: FastifyInstance;
  registrations: readonly EventHandlerRegistration[];
}

export function startWorkers(deps: StartWorkersDeps): WorkersHandle {
  const { app, registrations } = deps;
  const ctx = app.ctx;
  const config = ctx.config;

  // 1. Wire event handlers — always, so in-process tests observe events
  //    even when WORKERS_ENABLED=false. The inbox guard ensures each
  //    handler runs at most once per event.
  registerEventHandlers(ctx.eventBus, registrations, {
    inbox: ctx.inbox,
    onError: (err, reg, event) => {
      app.log.warn({ err, handler: reg.handlerName, event: event.name }, 'event handler failed');
    },
  });

  if (!config.WORKERS_ENABLED) {
    app.log.info('workers disabled (WORKERS_ENABLED=false)');
    return { workers: [], async stop() {} };
  }

  // 2. Outbox dispatcher worker
  const dispatcher = createOutboxDispatcher({
    outbox: ctx.outbox,
    eventBus: ctx.eventBus,
    logger: app.log,
  });

  const outboxWorker = createSchedulerWorker({
    name: 'outbox-dispatcher',
    intervalMs: config.OUTBOX_POLL_INTERVAL_MS,
    runOnStart: true,
    logger: app.log,
    tick: async () => {
      await dispatcher.tick(config.OUTBOX_BATCH_SIZE);
    },
  });

  const workers: SchedulerWorker[] = [outboxWorker];
  for (const w of workers) w.start();

  app.log.info({ workerCount: workers.length }, 'background workers started');

  return {
    workers,
    async stop(): Promise<void> {
      await Promise.all(workers.map((w) => w.stop()));
      app.log.info('background workers stopped');
    },
  };
}
