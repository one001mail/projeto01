/**
 * PostgreSQL LearningSession repository.
 *
 * Maps between the aggregate and the `learning_sessions` table. Accepts a
 * default-runner factory so callers inside a transaction can run against
 * the ambient client (via TransactionManager). Translates PG unique-violation
 * errors (code 23505) into the domain-level `LearningSessionAlreadyExistsError`.
 */
import type { QueryRunner } from '../../../shared/application/ports/transaction-manager.port.js';
import {
  LearningSession,
  type LearningSessionProps,
  type LearningSessionStatus,
} from '../domain/learning-session.entity.js';
import {
  LearningSessionAlreadyExistsError,
  type LearningSessionRepository,
} from '../domain/learning-session.repository.js';

interface Row {
  id: string;
  public_code: string;
  status: string;
  subject: string | null;
  input_value: string | null;
  computed_result: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  expires_at: Date | string | null;
}

function toDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

function nullableDate(v: Date | string | null): Date | null {
  if (v === null) return null;
  return toDate(v);
}

function parseNumeric(v: string | null): number | null {
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function rowToProps(row: Row): LearningSessionProps {
  return {
    id: row.id,
    publicCode: row.public_code,
    status: row.status as LearningSessionStatus,
    subject: row.subject,
    inputValue: parseNumeric(row.input_value),
    computedResult: parseNumeric(row.computed_result),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    expiresAt: nullableDate(row.expires_at),
  };
}

export interface PgLearningSessionRepositoryDeps {
  defaultRunner: () => QueryRunner;
}

export function createPgLearningSessionRepository(
  deps: PgLearningSessionRepositoryDeps,
): LearningSessionRepository {
  return {
    async findByPublicCode(publicCode) {
      const r = deps.defaultRunner();
      const res = await r.query<Row>(
        `SELECT id, public_code, status, subject, input_value, computed_result,
                created_at, updated_at, expires_at
         FROM learning_sessions
         WHERE public_code = $1
         LIMIT 1`,
        [publicCode],
      );
      const row = res.rows[0];
      return row ? LearningSession.restore(rowToProps(row)) : null;
    },

    async save(session) {
      const r = deps.defaultRunner();
      try {
        await r.query(
          `INSERT INTO learning_sessions
             (id, public_code, status, subject, input_value, computed_result,
              created_at, updated_at, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            session.id,
            session.publicCode,
            session.status,
            session.subject,
            session.inputValue,
            session.computedResult,
            session.createdAt,
            session.updatedAt,
            session.expiresAt,
          ],
        );
      } catch (e) {
        const pgErr = e as { code?: string; constraint?: string };
        if (pgErr.code === '23505') {
          throw new LearningSessionAlreadyExistsError(session.publicCode);
        }
        throw e;
      }
    },
  };
}
