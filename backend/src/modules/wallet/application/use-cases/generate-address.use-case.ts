/**
 * GenerateAddressUseCase.
 *
 * Requests a fresh receiving address for a wallet + network. In
 * non-custodial mode the backend calls the PublicAddressDerivationProvider
 * which derives the address from public material only (no private keys).
 * In custodial mode, derivation goes through the KeyManagementProvider
 * which returns only the public address; the private key never leaves
 * the KMS boundary.
 */
import type { Clock } from '../../../../shared/application/ports/clock.port.js';
import type { UuidGenerator } from '../../../../shared/application/ports/uuid.port.js';
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import type { MainnetGatePolicy } from '../../domain/policies/mainnet-gate.policy.js';
import type { WalletAddressRepository } from '../../domain/repositories/wallet-address.repository.js';
import type { WalletRepository } from '../../domain/repositories/wallet.repository.js';
import type { AddressDerivationService } from '../../domain/services/address-derivation.service.js';
import type { NetworkFamily, NetworkKind } from '../../domain/value-objects/network.js';
import { Network } from '../../domain/value-objects/network.js';
import type { GenerateAddressDto, GenerateAddressResultDto } from '../dto/generate-address.dto.js';
import { toGenerateAddressResultDto } from '../mappers/wallet-address.mapper.js';
import type { AuditSinkPort } from './create-wallet.use-case.js';

/** Port for network-agnostic public address derivation (no private keys). */
export interface PublicAddressDeriverPort {
  deriveNext(input: {
    walletId: string;
    network: NetworkKind;
    family: NetworkFamily;
    addressIndex: number;
    custodyKeyRef: string | null;
  }): Promise<{ address: string; chainId: number | null }>;
}

export type GenerateAddressError =
  | { kind: 'WALLET_NOT_FOUND'; message: string }
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'MAINNET_DISABLED'; message: string }
  | { kind: 'DERIVATION_FAILED'; message: string };

export interface GenerateAddressDeps {
  readonly walletRepo: WalletRepository;
  readonly addressRepo: WalletAddressRepository;
  readonly uuid: UuidGenerator;
  readonly clock: Clock;
  readonly deriver: PublicAddressDeriverPort;
  readonly derivationService: AddressDerivationService;
  readonly mainnetGate: MainnetGatePolicy;
  readonly audit: AuditSinkPort;
}

function defaultAssetFor(network: NetworkKind): string {
  return network.startsWith('ethereum') ? 'ETH' : 'BTC';
}

export class GenerateAddressUseCase {
  constructor(private readonly deps: GenerateAddressDeps) {}

  async execute(
    input: GenerateAddressDto,
  ): Promise<Ok<GenerateAddressResultDto> | Err<GenerateAddressError>> {
    let network: Network;
    try {
      network = Network.of(input.network);
    } catch (e) {
      return err({
        kind: 'INVALID_INPUT',
        message: e instanceof Error ? e.message : 'invalid network',
      });
    }
    try {
      this.deps.mainnetGate.ensureAllowed(network.kind);
    } catch (e) {
      return err({
        kind: 'MAINNET_DISABLED',
        message: e instanceof Error ? e.message : 'mainnet disabled',
      });
    }
    const wallet = await this.deps.walletRepo.findById(input.walletId);
    if (!wallet) {
      return err({ kind: 'WALLET_NOT_FOUND', message: `Wallet '${input.walletId}' not found` });
    }
    if (!wallet.supports(network)) {
      return err({
        kind: 'INVALID_INPUT',
        message: `Wallet does not support network '${network.kind}'`,
      });
    }
    const index = await this.deps.addressRepo.nextIndex(wallet.id, network.kind);
    let derived: { address: string; chainId: number | null };
    try {
      derived = await this.deps.deriver.deriveNext({
        walletId: wallet.id,
        network: network.kind,
        family: network.family,
        addressIndex: index,
        custodyKeyRef: wallet.custodyKeyRef,
      });
    } catch (e) {
      return err({
        kind: 'DERIVATION_FAILED',
        message: e instanceof Error ? e.message : 'derivation failed',
      });
    }
    try {
      const entity = this.deps.derivationService.assembleAddress({
        id: this.deps.uuid.v4(),
        wallet,
        network,
        addressIndex: index,
        publicAddress: derived.address,
        asset: input.asset ?? defaultAssetFor(network.kind),
        chainId: derived.chainId,
        now: this.deps.clock.now(),
      });
      await this.deps.addressRepo.save(entity);
      await this.deps.audit.record({
        operation: 'wallet.address-generated',
        actor: wallet.ownerRef,
        subject: entity.id,
        metadata: {
          walletId: wallet.id,
          network: network.kind,
          address: entity.address.value,
          addressIndex: index,
        },
      });
      return ok(toGenerateAddressResultDto(entity));
    } catch (e) {
      return err({ kind: 'INVALID_INPUT', message: e instanceof Error ? e.message : 'invalid' });
    }
  }
}
