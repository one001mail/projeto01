/**
 * PG-backed `ResourceReservationRepository`.
 */
import type { TransactionManager } from '../../../../shared/application/ports/transaction-manager.port.js';
import { ResourceReservation } from '../../domain/entities/resource-reservation.entity.js';
import type { ResourceReservationRepository } from '../../domain/repositories/resource-reservation.repository.js';
import { AllocationId } from '../../domain/value-objects/allocation-id.vo.js';
import { ReservationAmount } from '../../domain/value-objects/reservation-amount.vo.js';

interface ReservationRow {
  id: string;
  session_id: string;
  namespace: string;
  amount: string;
  status: string;
  created_at: Date;
  released_at: Date | null;
  expires_at: Date | null;
}

function rowToEntity(row: ReservationRow): ResourceReservation {
  const status =
    row.status === 'reserved' ||
    row.status === 'released' ||
    row.status === 'expired' ||
    row.status === 'failed'
      ? row.status
      : 'reserved';
  return ResourceReservation.restore({
    id: row.id,
    namespace: AllocationId.fromString(row.namespace),
    sessionId: row.session_id,
    amount: ReservationAmount.of(row.amount),
    status,
    createdAt: row.created_at,
    releasedAt: row.released_at,
    expiresAt: row.expires_at,
  });
}

export function createPgResourceReservationRepository(
  tm: TransactionManager,
): ResourceReservationRepository {
  return {
    async save(r) {
      const runner = tm.getCurrentRunner();
      await runner.query(
        `INSERT INTO resource_reservations
           (id, session_id, namespace, amount, status, created_at, released_at, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          r.id,
          r.sessionId,
          r.namespace.toString(),
          r.amount.toNumber(),
          r.status.toString(),
          r.createdAt,
          r.releasedAt,
          r.expiresAt,
        ],
      );
    },

    async update(r) {
      const runner = tm.getCurrentRunner();
      await runner.query(
        `UPDATE resource_reservations
         SET status = $2, released_at = $3, expires_at = $4
         WHERE id = $1`,
        [r.id, r.status.toString(), r.releasedAt, r.expiresAt],
      );
    },

    async findById(id) {
      const runner = tm.getCurrentRunner();
      const res = await runner.query<ReservationRow>(
        `SELECT id, session_id, namespace, amount, status,
                created_at, released_at, expires_at
         FROM resource_reservations WHERE id = $1`,
        [id],
      );
      const row = res.rows[0];
      return row ? rowToEntity(row) : null;
    },

    async sumReservedAmount(namespace) {
      const runner = tm.getCurrentRunner();
      const res = await runner.query<{ total: string | null }>(
        `SELECT COALESCE(SUM(amount), 0)::text as total
         FROM resource_reservations
         WHERE namespace = $1 AND status = 'reserved'`,
        [namespace],
      );
      return Number(res.rows[0]?.total ?? 0);
    },

    async listExpiredReserved(now, limit) {
      const runner = tm.getCurrentRunner();
      const res = await runner.query<ReservationRow>(
        `SELECT id, session_id, namespace, amount, status,
                created_at, released_at, expires_at
         FROM resource_reservations
         WHERE status = 'reserved'
           AND expires_at IS NOT NULL
           AND expires_at <= $1
         ORDER BY expires_at ASC
         LIMIT $2`,
        [now, limit],
      );
      return res.rows.map(rowToEntity);
    },
  };
}
