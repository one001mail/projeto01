/**
 * Base Entity.
 *
 * Shared DDD building block. Entities are compared by identity, not value.
 * Pure: no framework imports, no I/O.
 */
export abstract class Entity<TId extends string = string> {
  protected constructor(protected readonly _id: TId) {}

  get id(): TId {
    return this._id;
  }

  equals(other: Entity<TId> | null | undefined): boolean {
    if (!other) return false;
    if (other === this) return true;
    return this._id === other._id;
  }
}
