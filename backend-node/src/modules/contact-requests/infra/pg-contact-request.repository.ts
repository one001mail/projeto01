/**
 * PostgreSQL ContactRequest repository.
 *
 * Translates PG-specific errors at the edge; the application layer sees only
 * domain / port interfaces. Accepts a default-runner factory so the write
 * participates in the ambient transaction opened by the use case.
 */
import type { QueryRunner } from '../../../shared/application/ports/transaction-manager.port.js';
import type { ContactRequestRepository } from '../domain/contact-request.repository.js';

export interface PgContactRequestRepositoryDeps {
  defaultRunner: () => QueryRunner;
}

export function createPgContactRequestRepository(
  deps: PgContactRequestRepositoryDeps,
): ContactRequestRepository {
  return {
    async save(request) {
      const r = deps.defaultRunner();
      await r.query(
        `INSERT INTO contact_requests (id, name, email, subject, message, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          request.id,
          request.name,
          request.email,
          request.subject,
          request.message,
          request.status,
          request.createdAt,
        ],
      );
    },
  };
}
