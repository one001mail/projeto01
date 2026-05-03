/**
 * PrepareTransactionUseCase.
 *
 * Validates ownership, limits, and network gating; estimates fees; and
 * builds an UNSIGNED transaction payload. The payload is returned to the
 * caller for signing — either client-side (non-custodial) or through the
 * KMS boundary (custodial). Nothing is broadcast here.
 */
import type { Clock } from '../../../../shared/application/ports/clock.port.js';
import type { UuidGenerator } from '../../../../shared/application/ports/uuid.port.js';
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import { BlockchainTransaction } from '../../domain/entities/blockchain-transaction.entity.js';
import type { FeeData } from '../../domain/entities/blockchain-transaction.entity.js';
import type { MainnetGatePolicy } from '../../domain/policies/mainnet-gate.policy.js';
import type { BlockchainTransactionRepository } from '../../domain/repositories/blockchain-transaction.repository.js';
import type { WalletAddressRepository } from '../../domain/repositories/wallet-address.repository.js';
import type { WalletRepository } from '../../domain/repositories/wallet.repository.js';
import type { TransactionPolicyService } from '../../domain/services/transaction-policy.service.js';
import type { NetworkKind } from '../../domain/value-objects/network.js';
import { Network } from '../../domain/value-objects/network.js';
import type {
  PrepareTransactionDto,
  PreparedTransactionDto,
} from '../dto/prepare-transaction.dto.js';
import { toPreparedTransactionDto } from '../mappers/blockchain-transaction.mapper.js';
import type { AuditSinkPort } from './create-wallet.use-case.js';

export interface TransactionBuilderPort {
  buildUnsigned(input: {
    network: NetworkKind;
    from: string;
    to: string;
    asset: string;
    amount: string;
  }): Promise<{ unsignedPayload: string; fee: FeeData }>;
}

export type PrepareTransactionError =
  | { kind: 'INVALID_INPUT'; message: string }
  | { kind: 'WALLET_NOT_FOUND'; message: string }
  | { kind: 'ADDRESS_NOT_FOUND'; message: string }
  | { kind: 'POLICY_VIOLATION'; message: string }
  | { kind: 'MAINNET_DISABLED'; message: string }
  | { kind: 'PROVIDER_ERROR'; message: string };

export interface PrepareTransactionDeps {
  readonly walletRepo: WalletRepository;
  readonly addressRepo: WalletAddressRepository;
  readonly txRepo: BlockchainTransactionRepository;
  readonly builder: TransactionBuilderPort;
  readonly uuid: UuidGenerator;
  readonly clock: Clock;
  readonly policy: TransactionPolicyService;
  readonly mainnetGate: MainnetGatePolicy;
  readonly defaultMaxAmountPerTx: string;
  readonly audit: AuditSinkPort;
}

export class PrepareTransactionUseCase {
  constructor(private readonly deps: PrepareTransactionDeps) {}

  async execute(
    input: PrepareTransactionDto,
  ): Promise<Ok<PreparedTransactionDto> | Err<PrepareTransactionError>> {
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
    const from = await this.deps.addressRepo.findByAddress(input.walletId, input.fromAddress);
    if (!from) {
      return err({
        kind: 'ADDRESS_NOT_FOUND',
        message: `From-address '${input.fromAddress}' not found under wallet '${input.walletId}'`,
      });
    }
    const policy = this.deps.policy.validate({
      wallet,
      fromAddress: from,
      network: network.kind,
      asset: input.asset,
      amount: input.amount,
      maxAmountPerTx: input.maxAmountPerTx ?? this.deps.defaultMaxAmountPerTx,
    });
    if (!policy.ok) {
      return err({ kind: 'POLICY_VIOLATION', message: policy.error.message });
    }
    let built: { unsignedPayload: string; fee: FeeData };
    try {
      built = await this.deps.builder.buildUnsigned({
        network: network.kind,
        from: input.fromAddress,
        to: input.toAddress,
        asset: input.asset,
        amount: input.amount,
      });
    } catch (e) {
      return err({
        kind: 'PROVIDER_ERROR',
        message: e instanceof Error ? e.message : 'tx build failed',
      });
    }
    try {
      const tx = BlockchainTransaction.prepare({
        id: this.deps.uuid.v4(),
        walletId: wallet.id,
        network: network.kind,
        fromAddress: input.fromAddress,
        toAddress: input.toAddress,
        asset: input.asset,
        amount: input.amount,
        fee: built.fee,
        unsignedPayload: built.unsignedPayload,
        now: this.deps.clock.now(),
      });
      await this.deps.txRepo.save(tx);
      await this.deps.audit.record({
        operation: 'wallet.transaction-prepared',
        actor: wallet.ownerRef,
        subject: tx.id,
        metadata: {
          walletId: wallet.id,
          network: network.kind,
          amount: input.amount,
          asset: input.asset,
        },
      });
      return ok(toPreparedTransactionDto(tx));
    } catch (e) {
      return err({ kind: 'INVALID_INPUT', message: e instanceof Error ? e.message : 'invalid' });
    }
  }
}
