import type { LogPolicy } from '../../domain/entities/log-policy.entity.js';
import { isPastRetention } from '../../domain/policies/retention-enforcement.policy.js';
import type {
  LogMinimizerRepository,
  LogRecord,
} from '../../domain/repositories/log-minimizer.repository.js';

export class InMemoryLogMinimizerRepository implements LogMinimizerRepository {
  private readonly policies = new Map<string, LogPolicy>();
  private records: LogRecord[] = [];

  async savePolicy(p: LogPolicy): Promise<void> {
    this.policies.set(p.id, p);
  }
  async findPolicy(id: string): Promise<LogPolicy | null> {
    return this.policies.get(id) ?? null;
  }
  async removeOlderThan(scope: string, cutoff: Date): Promise<number> {
    const before = this.records.length;
    this.records = this.records.filter(
      (r) => !(r.scope === scope && isPastRetention(r.createdAt, cutoff)),
    );
    return before - this.records.length;
  }
  async seedRecord(r: LogRecord): Promise<void> {
    this.records.push(r);
  }
  reset(): void {
    this.policies.clear();
    this.records = [];
  }
}
