import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import { DEFAULT_EXPIRATION_SECONDS } from '../../domain/policies/address-expiration.policy.js';
import { enforceMinimalMetadata } from '../../domain/policies/minimal-metadata.policy.js';
import type { AddressGeneratorRepository } from '../../domain/repositories/address-generator.repository.js';
import { AddressGenerationService } from '../../domain/services/address-generation.service.js';

export interface GenerateAddressCommand {
  readonly namespace: string;
  readonly correlationId?: string | null;
  readonly ttlSeconds?: number | null;
}

export interface GenerateAddressResult {
  readonly id: string;
  readonly namespace: string;
  readonly token: string;
  readonly status: 'active';
  readonly expiresAt: string | null;
  readonly createdAt: string;
  readonly disclaimer: string;
}

export type GenerateAddressError = { kind: 'INVALID_INPUT'; message: string };

export interface MockAddressProvider {
  generate(): string;
}

export interface UuidPort {
  v4(): string;
}

export class GenerateAddressUseCase {
  constructor(
    private readonly repo: AddressGeneratorRepository,
    private readonly uuid: UuidPort,
    private readonly provider: MockAddressProvider,
    private readonly svc: AddressGenerationService = new AddressGenerationService(),
  ) {}

  async execute(
    cmd: GenerateAddressCommand,
  ): Promise<Ok<GenerateAddressResult> | Err<GenerateAddressError>> {
    try {
      enforceMinimalMetadata({
        namespace: cmd.namespace,
        correlationId: cmd.correlationId ?? null,
      });
      const now = new Date();
      const ttl = cmd.ttlSeconds ?? DEFAULT_EXPIRATION_SECONDS;
      const expiresAt = new Date(now.getTime() + ttl * 1000);
      const entity = this.svc.issue({
        id: this.uuid.v4(),
        namespace: cmd.namespace,
        mockToken: this.provider.generate(),
        correlationId: cmd.correlationId ?? null,
        expiresAt,
        now,
      });
      await this.repo.save(entity);
      return ok({
        id: entity.id,
        namespace: entity.namespace,
        token: entity.token,
        status: 'active',
        expiresAt: entity.expiresAt,
        createdAt: entity.createdAt.toISOString(),
        disclaimer:
          'SANDBOX-ONLY mock token. Not a wallet, not a blockchain address, not spendable.',
      });
    } catch (e) {
      return err({ kind: 'INVALID_INPUT', message: e instanceof Error ? e.message : 'invalid' });
    }
  }
}
