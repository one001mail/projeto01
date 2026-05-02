/**
 * AllocationId value object.
 *
 * Logical pool id (a sandbox namespace). Pure VO.
 */
const MAX_LEN = 64;
const RE = /^[a-z][a-z0-9._-]{0,63}$/;

export class AllocationId {
  private constructor(private readonly raw: string) {}

  static fromString(value: string): AllocationId {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.length === 0) throw new Error('AllocationId must not be empty');
    if (trimmed.length > MAX_LEN) throw new Error(`AllocationId must be <= ${MAX_LEN} chars`);
    if (!RE.test(trimmed)) {
      throw new Error('AllocationId must start with a letter and contain only [a-z0-9._-]');
    }
    return new AllocationId(trimmed);
  }

  toString(): string {
    return this.raw;
  }

  equals(other: AllocationId): boolean {
    return this.raw === other.raw;
  }
}
