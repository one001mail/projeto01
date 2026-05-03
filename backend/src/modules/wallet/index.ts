/**
 * Wallet module composition root.
 *
 * Loads wallet-specific configuration, builds the dependency graph via
 * `buildWalletModule`, registers Fastify routes under `/api`, and
 * attaches module handles to the app. Nothing in this file logs secret
 * material; the startup line only reports safe, enumerable config.
 */
import type { FastifyInstance } from 'fastify';
import { makeWalletRoutes } from './http/wallet.routes.js';
import { summarizeWalletConfig } from './infra/config/wallet.config.js';
import { type BuiltWalletModule, buildWalletModule } from './infra/factories/wallet.factory.js';

export interface WalletModuleHandle {
  readonly name: 'wallet';
  readonly built: BuiltWalletModule;
}

declare module 'fastify' {
  interface FastifyInstance {
    wallet?: WalletModuleHandle;
  }
}

export async function registerWalletModule(app: FastifyInstance): Promise<void> {
  // 1) Build module — validates env, constructs repos, providers, use cases.
  let built: BuiltWalletModule;
  try {
    built = buildWalletModule({ logger: app.log });
  } catch (e) {
    app.log.error(
      {
        module: 'wallet',
        err: e instanceof Error ? { message: e.message, name: e.name } : undefined,
      },
      'wallet module failed to start — invalid environment configuration',
    );
    throw e;
  }

  // 2) Log safe startup summary. NEVER includes secrets or private keys.
  const summary = summarizeWalletConfig(built.config);
  app.log.info(
    { module: 'wallet', ...summary },
    `wallet module ready (mode=${summary.defaultMode}, mainnetEnabled=${summary.mainnetEnabled})`,
  );

  // 3) Register HTTP routes under /api.
  await app.register(
    async (api) => {
      await api.register(
        makeWalletRoutes({
          createWallet: built.useCases.createWallet,
          generateAddress: built.useCases.generateAddress,
          getWalletMetadata: built.useCases.getWalletMetadata,
          getAddressBalance: built.useCases.getAddressBalance,
          prepareTransaction: built.useCases.prepareTransaction,
          broadcastTransaction: built.useCases.broadcastTransaction,
          syncWalletBalances: built.useCases.syncWalletBalances,
        }),
      );
    },
    { prefix: '/api' },
  );

  // 4) Attach module handle for test / cross-module introspection.
  app.wallet = { name: 'wallet', built };
}
