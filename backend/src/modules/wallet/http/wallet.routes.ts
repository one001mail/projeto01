/**
 * Wallet HTTP routes.
 *
 * Exposes the wallet module as a Fastify plugin. All endpoints are
 * mounted under `/api` by the composition root. Every handler:
 *
 *   - validates input via a Zod schema;
 *   - delegates to a use case (no business logic in the route);
 *   - runs outgoing payloads through `SecretRedactionService` as
 *     defense-in-depth before returning.
 *
 * No endpoint returns private keys, seed phrases, or encrypted secrets.
 */
import type { FastifyPluginAsync } from 'fastify';
import { AppError } from '../../../shared/errors/app-error.js';
import type { BroadcastTransactionUseCase } from '../application/use-cases/broadcast-transaction.use-case.js';
import type { CreateWalletUseCase } from '../application/use-cases/create-wallet.use-case.js';
import type { GenerateAddressUseCase } from '../application/use-cases/generate-address.use-case.js';
import type { GetAddressBalanceUseCase } from '../application/use-cases/get-address-balance.use-case.js';
import type { GetWalletMetadataUseCase } from '../application/use-cases/get-wallet-metadata.use-case.js';
import type { PrepareTransactionUseCase } from '../application/use-cases/prepare-transaction.use-case.js';
import type { SyncWalletBalancesUseCase } from '../application/use-cases/sync-wallet-balances.use-case.js';
import { SecretRedactionService } from '../infra/security/secret-redaction.service.js';
import {
  BroadcastTransactionBodySchema,
  CreateWalletBodySchema,
  GenerateAddressBodySchema,
  PrepareTransactionBodySchema,
  WalletAddressParamSchema,
  WalletIdParamSchema,
} from './wallet.schemas.js';

export interface WalletRoutesDeps {
  readonly createWallet: CreateWalletUseCase;
  readonly generateAddress: GenerateAddressUseCase;
  readonly getWalletMetadata: GetWalletMetadataUseCase;
  readonly getAddressBalance: GetAddressBalanceUseCase;
  readonly prepareTransaction: PrepareTransactionUseCase;
  readonly broadcastTransaction: BroadcastTransactionUseCase;
  readonly syncWalletBalances: SyncWalletBalancesUseCase;
}

function errorKindToStatus(kind: string): number {
  switch (kind) {
    case 'WALLET_NOT_FOUND':
    case 'ADDRESS_NOT_FOUND':
    case 'TRANSACTION_NOT_FOUND':
      return 404;
    case 'WALLET_MISMATCH':
    case 'POLICY_VIOLATION':
      return 409;
    case 'MAINNET_DISABLED':
      return 403;
    case 'PROVIDER_ERROR':
    case 'BROADCAST_FAILED':
      return 422;
    case 'DERIVATION_FAILED':
      return 422;
    default:
      return 400;
  }
}

export function makeWalletRoutes(deps: WalletRoutesDeps): FastifyPluginAsync {
  const redactor = new SecretRedactionService();

  return async (app) => {
    app.post('/wallets', async (req, reply) => {
      const body = CreateWalletBodySchema.parse(req.body ?? {});
      const result = await deps.createWallet.execute({
        ownerRef: body.ownerRef,
        ...(body.mode ? { mode: body.mode } : {}),
        supportedNetworks: body.supportedNetworks,
        custodyKeyRef: body.custodyKeyRef ?? null,
        label: body.label ?? null,
      });
      if (!result.ok) {
        throw new AppError({
          code: 'BAD_REQUEST' as never,
          statusCode: errorKindToStatus(result.error.kind),
          message: result.error.message,
        });
      }
      return reply.code(201).send(redactor.redact({ wallet: result.value }));
    });

    app.get('/wallets/:walletId', async (req, reply) => {
      const params = WalletIdParamSchema.parse(req.params ?? {});
      const result = await deps.getWalletMetadata.execute(params.walletId);
      if (!result.ok) {
        throw new AppError({
          code: 'NOT_FOUND' as never,
          statusCode: errorKindToStatus(result.error.kind),
          message: result.error.message,
        });
      }
      return reply.code(200).send(redactor.redact({ wallet: result.value }));
    });

    app.post('/wallets/:walletId/addresses', async (req, reply) => {
      const params = WalletIdParamSchema.parse(req.params ?? {});
      const body = GenerateAddressBodySchema.parse(req.body ?? {});
      const result = await deps.generateAddress.execute({
        walletId: params.walletId,
        network: body.network,
        asset: body.asset ?? null,
      });
      if (!result.ok) {
        throw new AppError({
          code: 'BAD_REQUEST' as never,
          statusCode: errorKindToStatus(result.error.kind),
          message: result.error.message,
        });
      }
      return reply.code(201).send(redactor.redact({ address: result.value }));
    });

    app.get('/wallets/:walletId/addresses/:address/balance', async (req, reply) => {
      const params = WalletAddressParamSchema.parse(req.params ?? {});
      const result = await deps.getAddressBalance.execute({
        walletId: params.walletId,
        address: params.address,
      });
      if (!result.ok) {
        throw new AppError({
          code: 'NOT_FOUND' as never,
          statusCode: errorKindToStatus(result.error.kind),
          message: result.error.message,
        });
      }
      return reply.code(200).send(redactor.redact({ balance: result.value }));
    });

    app.post('/wallets/:walletId/transactions/prepare', async (req, reply) => {
      const params = WalletIdParamSchema.parse(req.params ?? {});
      const body = PrepareTransactionBodySchema.parse(req.body ?? {});
      const result = await deps.prepareTransaction.execute({
        walletId: params.walletId,
        network: body.network,
        fromAddress: body.fromAddress,
        toAddress: body.toAddress,
        asset: body.asset,
        amount: body.amount,
        maxAmountPerTx: body.maxAmountPerTx ?? null,
      });
      if (!result.ok) {
        throw new AppError({
          code: 'BAD_REQUEST' as never,
          statusCode: errorKindToStatus(result.error.kind),
          message: result.error.message,
        });
      }
      return reply.code(201).send(redactor.redact({ transaction: result.value }));
    });

    app.post('/wallets/:walletId/transactions/broadcast', async (req, reply) => {
      const params = WalletIdParamSchema.parse(req.params ?? {});
      const body = BroadcastTransactionBodySchema.parse(req.body ?? {});
      const result = await deps.broadcastTransaction.execute({
        walletId: params.walletId,
        transactionId: body.transactionId,
        signedRawTx: body.signedRawTx,
      });
      if (!result.ok) {
        throw new AppError({
          code: 'UNPROCESSABLE_ENTITY' as never,
          statusCode: errorKindToStatus(result.error.kind),
          message: result.error.message,
        });
      }
      return reply.code(200).send(redactor.redact({ transaction: result.value }));
    });

    app.post('/wallets/:walletId/sync-balances', async (req, reply) => {
      const params = WalletIdParamSchema.parse(req.params ?? {});
      const result = await deps.syncWalletBalances.execute(params.walletId);
      if (!result.ok) {
        throw new AppError({
          code: 'NOT_FOUND' as never,
          statusCode: errorKindToStatus(result.error.kind),
          message: result.error.message,
        });
      }
      return reply.code(200).send(redactor.redact({ sync: result.value }));
    });
  };
}
