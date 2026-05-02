/**
 * SandboxToken value object.
 *
 * The opaque, **explicitly sandbox** identifier surfaced to the caller.
 * Always carries a `sbx_` prefix to make it unmistakably distinct from
 * real Bitcoin / Ethereum / payment-rail addresses. Pure value object
 * with strict shape validation — the policy layer enforces what the
 * generator may produce.
 */
import { SANDBOX_TOKEN_PREFIX, SandboxTokenPolicy } from '../policies/sandbox-token.policy.js';

const MAX_LEN = 96;

export class SandboxToken {
  private constructor(private readonly raw: string) {}

  static fromString(value: string): SandboxToken {
    if (typeof value !== 'string') throw new Error('SandboxToken must be a string');
    if (value.length === 0) throw new Error('SandboxToken must not be empty');
    if (value.length > MAX_LEN) throw new Error(`SandboxToken must be <= ${MAX_LEN} chars`);
    SandboxTokenPolicy.assertSandbox(value);
    return new SandboxToken(value);
  }

  static get prefix(): string {
    return SANDBOX_TOKEN_PREFIX;
  }

  toString(): string {
    return this.raw;
  }

  equals(other: SandboxToken): boolean {
    return this.raw === other.raw;
  }
}
