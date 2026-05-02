/**
 * UUID port.
 *
 * Decouples uuid generation from `crypto.randomUUID()` so tests can produce
 * deterministic ids and so future migrations to ULID/KSUID don't ripple.
 */
export interface UuidGenerator {
  /** RFC 4122 v4 uuid by default. */
  v4(): string;
}

export class CryptoUuidGenerator implements UuidGenerator {
  v4(): string {
    return crypto.randomUUID();
  }
}

export class SequentialUuidGenerator implements UuidGenerator {
  private n = 0;
  v4(): string {
    this.n += 1;
    const hex = this.n.toString(16).padStart(12, '0');
    return `00000000-0000-4000-8000-${hex}`;
  }
  reset(): void {
    this.n = 0;
  }
}
