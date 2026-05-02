/**
 * resource-reservations module composition root.
 *
 * Sandbox-only simulation. NEVER moves real funds. NEVER touches a wallet.
 * The per-namespace caps live on `Config` (defaults below).
 */
import type { FastifyInstance } from 'fastify';
import { SystemClock } from '../../shared/application/ports/clock.port.js';
import { CryptoUuidGenerator } from '../../shared/application/ports/uuid.port.js';
import { GetReservationStatusUseCase } from './application/use-cases/get-reservation-status.use-case.js';
import { ReconcileReservationsUseCase } from './application/use-cases/reconcile-reservations.use-case.js';
import { ReleaseResourceUseCase } from './application/use-cases/release-resource.use-case.js';
import {
  type AllocationCaps,
  ReserveResourceUseCase,
} from './application/use-cases/reserve-resource.use-case.js';
import type { ResourceReservationRepository } from './domain/repositories/resource-reservation.repository.js';
import { InMemoryResourceReservationRepository } from './infra/persistence/in-memory-resource-reservation.repository.js';
import { createPgResourceReservationRepository } from './infra/persistence/pg-resource-reservation.repository.js';

/**
 * Default per-namespace caps used when the host environment does not
 * configure overrides. Values are unitless quotas in the simulation.
 */
export const DEFAULT_ALLOCATION_CAPS: AllocationCaps = {};
export const DEFAULT_FALLBACK_CAP = 1_000;

export async function registerResourceReservationsModule(app: FastifyInstance): Promise<void> {
  const ctx = app.ctx;
  const clock = new SystemClock();
  const uuid = new CryptoUuidGenerator();

  const repo: ResourceReservationRepository = ctx.sandboxFallback
    ? new InMemoryResourceReservationRepository()
    : createPgResourceReservationRepository(ctx.tm);

  const outboxSaver = {
    save: async (e: {
      id: string;
      name: string;
      occurredAt: string;
      payload: unknown;
      aggregateId?: string;
    }) => ctx.outbox.save(e),
  };

  const reserveUc = new ReserveResourceUseCase({
    repo,
    clock,
    uuid,
    caps: DEFAULT_ALLOCATION_CAPS,
    defaultCap: DEFAULT_FALLBACK_CAP,
    outbox: outboxSaver,
  });
  const releaseUc = new ReleaseResourceUseCase({ repo, clock, uuid, outbox: outboxSaver });
  const reconcileUc = new ReconcileReservationsUseCase({
    repo,
    clock,
    uuid,
    outbox: outboxSaver,
  });
  const getStatusUc = new GetReservationStatusUseCase(repo, clock);

  ctx.useCases.resourceReservations = {
    reserve: reserveUc,
    release: releaseUc,
    reconcile: reconcileUc,
    getStatus: getStatusUc,
  };

  app.log.debug({ module: 'resource-reservations' }, 'resource-reservations module ready');
}
