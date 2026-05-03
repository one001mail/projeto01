/**
 * CreateWalletUseCase.
 *
 * Creates wallet metadata in the selected mode. Non-custodial by default:
 * no key material is generated or held by the backend.
 *
 * When `custodial` is selected, the caller MUST supply an opaque
 * `custodyKeyRef` obtained from a KeyManagementProvider (HSM/KMS in
 * production; `LocalEncryptedKeyManagementProvider` in development).
 * The raw private key NEVER crosses this boundary.
 */
import type { Clock } from '../../../../shared/application/ports/clock.port.js';
import type { UuidGenerator } from '../../../../shared/application/ports/uuid.port.js';
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import { enforcePrivateKeySafety } from '../../domain/policies/private-key-safety.policy.js';
import type { WalletRepository } from '../../domain/repositories/wallet.repository.js';
import type { WalletDomainService } from '../../domain/services/wallet-domain.service.js';
import type { CreateWalletDto, CreateWalletResultDto } from '../dto/create-wallet.dto.js';
import { toCreateWalletResultDto } from '../mappers/wallet.mapper.js';

export type CreateWalletError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'MAINNET_DISABLED'; message: string };

/** Audit-log sink port (structural; implemented in infra). */
export interface AuditSinkPort {
  record(event: {
    operation: string;
    actor: string;
    subject: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}

export interface CreateWalletDeps {
  readonly walletRepo: WalletRepository;
  readonly uuid: UuidGenerator;
  readonly clock: Clock;
  readonly domain: WalletDomainService;
  readonly defaultMode: 'non_custodial' | 'custodial';
  readonly mainnetEnabled: boolean;
  readonly audit: AuditSinkPort;
}

export class CreateWalletUseCase {
  constructor(private readonly deps: CreateWalletDeps) {}

  async execute(
    input: CreateWalletDto,
  ): Promise<Ok<CreateWalletResultDto> | Err<CreateWalletError>> {
    try {
      enforcePrivateKeySafety(input as unknown as Record<string, unknown>, 'CreateWalletUseCase');
      const wallet = this.deps.domain.createWallet(
        {
          id: this.deps.uuid.v4(),
          ownerRef: input.ownerRef,
          mode: input.mode ?? this.deps.defaultMode,
          supportedNetworks: input.supportedNetworks,
          custodyKeyRef: input.custodyKeyRef ?? null,
          label: input.label ?? null,
          now: this.deps.clock.now(),
        },
        {
          mainnetEnabled: this.deps.mainnetEnabled,
          defaultMode: this.deps.defaultMode,
        },
      );
      await this.deps.walletRepo.save(wallet);
      await this.deps.audit.record({
        operation: 'wallet.created',
        actor: wallet.ownerRef,
        subject: wallet.id,
        metadata: {
          mode: wallet.mode,
          supportedNetworks: wallet.supportedNetworks.map((n) => n.kind),
        },
      });
      return ok(toCreateWalletResultDto(wallet));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'invalid input';
      if (/mainnet/i.test(message) && /disabled/i.test(message)) {
        return err({ kind: 'MAINNET_DISABLED', message });
      }
      return err({ kind: 'INVALID_INPUT', message });
    }
  }
}
