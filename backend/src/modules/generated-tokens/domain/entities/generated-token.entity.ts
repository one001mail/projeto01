/**
 * GeneratedToken aggregate.
 *
 * Sandbox-only opaque identifier. The aggregate enforces:
 *   * the token string passes `SandboxTokenPolicy`
 *   * metadata is sanitised by `MinimalMetadataPolicy`
 *   * lifecycle transitions go through `TokenStatus`
 *
 * Pure: no I/O, no framework imports. Construction is explicit — callers
 * must supply a pre-validated `SandboxToken` instance.
 */
import { MinimalMetadataPolicy } from '../policies/minimal-metadata.policy.js';
import { TokenExpirationPolicy } from '../policies/token-expiration.policy.js';
import type { SandboxToken } from '../value-objects/sandbox-token.vo.js';
import type { TokenNamespace } from '../value-objects/token-namespace.vo.js';
import { TokenStatus } from '../value-objects/token-status.vo.js';

export interface GeneratedTokenProps {
  readonly id: string;
  readonly namespace: TokenNamespace;
  readonly token: SandboxToken;
  status: TokenStatus;
  readonly metadata: Record<string, string>;
  readonly createdAt: Date;
  readonly expiresAt: Date | null;
}

export interface CreateGeneratedTokenArgs {
  readonly id: string;
  readonly namespace: TokenNamespace;
  readonly token: SandboxToken;
  readonly metadata?: Record<string, unknown> | null;
  readonly createdAt: Date;
  readonly expiresAt?: Date | null;
}

export interface RestoreGeneratedTokenArgs {
  readonly id: string;
  readonly namespace: TokenNamespace;
  readonly token: SandboxToken;
  readonly status: 'active' | 'revoked' | 'expired';
  readonly metadata: Record<string, string>;
  readonly createdAt: Date;
  readonly expiresAt: Date | null;
}

export class GeneratedToken {
  private constructor(private props: GeneratedTokenProps) {}

  static create(args: CreateGeneratedTokenArgs): GeneratedToken {
    const metadata = MinimalMetadataPolicy.sanitise(
      (args.metadata ?? null) as Record<string, unknown> | null,
    );
    return new GeneratedToken({
      id: args.id,
      namespace: args.namespace,
      token: args.token,
      status: TokenStatus.active(),
      metadata,
      createdAt: args.createdAt,
      expiresAt: args.expiresAt ?? null,
    });
  }

  static restore(args: RestoreGeneratedTokenArgs): GeneratedToken {
    return new GeneratedToken({
      id: args.id,
      namespace: args.namespace,
      token: args.token,
      status: TokenStatus.fromString(args.status),
      metadata: { ...args.metadata },
      createdAt: args.createdAt,
      expiresAt: args.expiresAt,
    });
  }

  get id(): string {
    return this.props.id;
  }
  get namespace(): TokenNamespace {
    return this.props.namespace;
  }
  get token(): SandboxToken {
    return this.props.token;
  }
  get status(): TokenStatus {
    return this.props.status;
  }
  get metadata(): Record<string, string> {
    return { ...this.props.metadata };
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }

  /** Refreshes derived status if TTL elapsed. Pure — no persistence. */
  refreshStatus(now: Date): void {
    if (
      this.props.status.isActive() &&
      TokenExpirationPolicy.isExpired(this.props.expiresAt, now)
    ) {
      this.props.status = TokenStatus.expired();
    }
  }

  revoke(): void {
    if (!this.props.status.canRevoke()) {
      throw new Error(
        `GeneratedToken ${this.props.id}: cannot revoke from status '${this.props.status.toString()}'`,
      );
    }
    this.props.status = TokenStatus.revoked();
  }

  expire(): void {
    if (!this.props.status.canExpire()) {
      throw new Error(
        `GeneratedToken ${this.props.id}: cannot expire from status '${this.props.status.toString()}'`,
      );
    }
    this.props.status = TokenStatus.expired();
  }
}
