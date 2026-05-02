/**
 * Hash service — SANDBOX-ONLY.
 *
 * Provides non-cryptographic, deterministic hashing for mock token
 * generation and audit-log payload fingerprinting. This is NOT suitable
 * for password hashing, message authentication, blockchain proofs or any
 * security-sensitive purpose.
 */
import { createHash } from 'node:crypto';

export interface HashService {
  /** SHA-256 hex digest. Deterministic. Not a password hash. */
  sha256(input: string): string;
  /** Short 16-char hex fingerprint suitable for log correlation. */
  fingerprint(input: string): string;
}

export class NodeHashService implements HashService {
  sha256(input: string): string {
    return createHash('sha256').update(input, 'utf8').digest('hex');
  }
  fingerprint(input: string): string {
    return this.sha256(input).slice(0, 16);
  }
}

export const hashService: HashService = new NodeHashService();
