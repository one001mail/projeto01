/**
 * BroadcastTransactionUseCase.
 *
 * Accepts a signed raw tx, sends it through the network provider, and
 * records the returned hash. The signed payload is NEVER logged in full
 * and is stored only as a sha256 reference.
 */
import { createHash } from 'node:crypto';
import type { Clock } from '../../../../shared/application/ports/clock.port.js';
import { type Err, type Ok, err, ok } from '../../../../shared/types/result.js';
import { TransactionBroadcastFailedError } from '../../domain/errors/transaction-broadcast-failed.error.js';
import type { BlockchainTransactionRepository } from '../../domain/repositories/blockchain-transaction.repository.js';
import type { WalletRepository } from '../../domain/repositories/wallet.repository.js';
import type { NetworkKind } from '../../domain/value-objects/network.js';
import type {
  BroadcastTransactionDto,
  BroadcastedTransactionDto,
} from '../dto/broadcast-transaction.dto.js';
import { toBroadcastedTransactionDto } from '../mappers/blockchain-transaction.mapper.js';
import type { AuditSinkPort } from './create-wallet.use-case.js';

export interface TransactionBroadcasterPort {
  broadcast(input: {
    network: NetworkKind;
    signedRawTx: string;
  }): Promise<{ txHash: string }>;
}

export type BroadcastTransactionError =
  | { kind: 'TRANSACTION_NOT_FOUND'; message: string }
  | { kind: 'WALLET_MISMATCH'; message: string }
  | { kind: 'BROADCAST_FAILED'; message: string };

export interface BroadcastTransactionDeps {
  readonly walletRepo: WalletRepository;
  readonly txRepo: BlockchainTransactionRepository;
  readonly broadcaster: TransactionBroadcasterPort;
  readonly clock: Clock;
  readonly audit: AuditSinkPort;
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export class BroadcastTransactionUseCase {
  constructor(private readonly deps: BroadcastTransactionDeps) {}

  async execute(
    input: BroadcastTransactionDto,
  ): Promise<Ok<BroadcastedTransactionDto> | Err<BroadcastTransactionError>> {
    const tx = await this.deps.txRepo.findById(input.transactionId);
    if (!tx) {
      return err({
        kind: 'TRANSACTION_NOT_FOUND',
        message: `Transaction '${input.transactionId}' not found`,
      });
    }
    if (tx.walletId !== input.walletId) {
      return err({
        kind: 'WALLET_MISMATCH',
        message: 'Transaction does not belong to this wallet',
      });
    }
    const wallet = await this.deps.walletRepo.findById(tx.walletId);
    const rawRef = sha256Hex(input.signedRawTx);
    tx.markBroadcasting(rawRef, this.deps.clock.now());
    try {
      const { txHash } = await this.deps.broadcaster.broadcast({
        network: tx.network.kind as NetworkKind,
        signedRawTx: input.signedRawTx,
      });
      tx.markBroadcasted(txHash, this.deps.clock.now());
      await this.deps.txRepo.save(tx);
      await this.deps.audit.record({
        operation: 'wallet.transaction-broadcasted',
        actor: wallet?.ownerRef ?? tx.walletId,
        subject: tx.id,
        metadata: {
          walletId: tx.walletId,
          network: tx.network.kind,
          txHash,
          signedRawTxSha256: rawRef,
        },
      });
      return ok(toBroadcastedTransactionDto(tx));
    } catch (e) {
      tx.markFailed(this.deps.clock.now());
      await this.deps.txRepo.save(tx);
      const message = e instanceof Error ? e.message : 'broadcast failed';
      if (e instanceof TransactionBroadcastFailedError) {
        return err({ kind: 'BROADCAST_FAILED', message: e.message });
      }
      return err({ kind: 'BROADCAST_FAILED', message });
    }
  }
}
