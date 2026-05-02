/** In-memory repository for resource-reservations. */
import type { ResourceReservation } from '../../domain/entities/resource-reservation.entity.js';
import type { ResourceReservationRepository } from '../../domain/repositories/resource-reservation.repository.js';

export class InMemoryResourceReservationRepository implements ResourceReservationRepository {
  private byId: Map<string, ResourceReservation> = new Map();

  async save(r: ResourceReservation): Promise<void> {
    this.byId.set(r.id, r);
  }

  async update(r: ResourceReservation): Promise<void> {
    this.byId.set(r.id, r);
  }

  async findById(id: string): Promise<ResourceReservation | null> {
    return this.byId.get(id) ?? null;
  }

  async sumReservedAmount(namespace: string): Promise<number> {
    let sum = 0;
    for (const r of this.byId.values()) {
      if (!r.status.isReserved()) continue;
      if (r.namespace.toString() !== namespace) continue;
      sum += r.amount.toNumber();
    }
    return sum;
  }

  async listExpiredReserved(now: Date, limit: number): Promise<readonly ResourceReservation[]> {
    const out: ResourceReservation[] = [];
    for (const r of this.byId.values()) {
      if (out.length >= limit) break;
      if (!r.status.isReserved()) continue;
      if (r.expiresAt && r.expiresAt.getTime() <= now.getTime()) {
        out.push(r);
      }
    }
    return out;
  }

  reset(): void {
    this.byId.clear();
  }

  size(): number {
    return this.byId.size;
  }
}
