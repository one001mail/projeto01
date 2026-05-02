/**
 * Cleanup Expired Audit Logs use case.
 *
 * Computes the retention cutoff via the policy, deletes older rows via the
 * repository, and emits an `audit-logs.cleaned` event through the outbox
 * port so downstream subscribers can react. Idempotent in the sense that
 * repeated calls return zero once the trail is below the cutoff.
 */
import type { Clock } from '../../../../shared/application/ports/clock.port.js';
import type { UuidGenerator } from '../../../../shared/application/ports/uuid.port.js';
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import { AUDIT_LOGS_CLEANED_EVENT } from '../../domain/events/audit-logs-cleaned.event.js';
import {
  AuditAccessPolicy,
  type AuditAccessSubject,
} from '../../domain/policies/audit-access.policy.js';
import { AuditRetentionPolicy } from '../../domain/policies/audit-retention.policy.js';
import type { AuditLogRepository } from '../../domain/repositories/audit-log.repository.js';
import { RetentionPeriod } from '../../domain/value-objects/retention-period.vo.js';

export interface CleanupExpiredAuditLogsInput {
  readonly retentionDays: number;
  readonly subject: AuditAccessSubject;
}

export interface CleanupExpiredAuditLogsResult {
  readonly removedCount: number;
  readonly cutoff: string | null;
  readonly cleanupEnabled: boolean;
  readonly executedAt: string;
}

export type CleanupExpiredAuditLogsError =
  | { kind: 'FORBIDDEN'; message: string }
  | { kind: 'INVALID_INPUT'; message: string };

export interface OutboxSaver {
  save(event: {
    id: string;
    name: string;
    occurredAt: string;
    payload: unknown;
    aggregateId?: string;
  }): Promise<string>;
}

export interface CleanupExpiredAuditLogsDeps {
  readonly repo: AuditLogRepository;
  readonly clock: Clock;
  readonly uuid: UuidGenerator;
  readonly outbox?: OutboxSaver;
}

export class CleanupExpiredAuditLogsUseCase {
  constructor(private readonly deps: CleanupExpiredAuditLogsDeps) {}

  async execute(
    input: CleanupExpiredAuditLogsInput,
  ): Promise<Ok<CleanupExpiredAuditLogsResult> | Err<CleanupExpiredAuditLogsError>> {
    if (!AuditAccessPolicy.canCleanup(input.subject)) {
      return err({ kind: 'FORBIDDEN', message: 'Caller is not allowed to cleanup audit logs' });
    }
    let period: RetentionPeriod;
    try {
      period = RetentionPeriod.ofDays(input.retentionDays);
    } catch (e) {
      return err({
        kind: 'INVALID_INPUT',
        message: e instanceof Error ? e.message : 'invalid retention',
      });
    }

    const now = this.deps.clock.now();
    const decision = AuditRetentionPolicy.decide(period, now);
    if (!decision.cleanupEnabled || !decision.cutoff) {
      return ok({
        removedCount: 0,
        cutoff: null,
        cleanupEnabled: false,
        executedAt: now.toISOString(),
      });
    }

    const removed = await this.deps.repo.deleteOlderThan(decision.cutoff);

    if (removed > 0 && this.deps.outbox) {
      await this.deps.outbox.save({
        id: this.deps.uuid.v4(),
        name: AUDIT_LOGS_CLEANED_EVENT,
        occurredAt: now.toISOString(),
        payload: {
          removedCount: removed,
          cutoff: decision.cutoff.toISOString(),
          retentionDays: period.toDays(),
          executedAt: now.toISOString(),
        },
      });
    }

    return ok({
      removedCount: removed,
      cutoff: decision.cutoff.toISOString(),
      cleanupEnabled: true,
      executedAt: now.toISOString(),
    });
  }
}
