/**
 * Module registration.
 *
 * Each bounded context exports a `registerModule()` plugin (see
 * `src/modules/_template/index.ts`) that wires its routes, event handlers,
 * and module-local infra. This file is the *only* place that imports module
 * roots; nothing else may reach into a module's internals.
 *
 * The modules array is the registry: order matters only when one module's
 * read model depends on another's events being subscribed first — in that
 * case, register the producer before the consumer.
 */
import type { FastifyInstance } from 'fastify';
import { registerTemplateModule } from '../modules/_template/index.js';
import { registerAddressGeneratorModule } from '../modules/address-generator/index.js';
import { registerAuditLogsModule } from '../modules/audit-logs/index.js';
import { registerBlockchainMonitorModule } from '../modules/blockchain-monitor/index.js';
import { registerContactRequestsModule } from '../modules/contact-requests/index.js';
import { registerDepositSagaModule } from '../modules/deposit-saga/index.js';
import { registerGeneratedTokensModule } from '../modules/generated-tokens/index.js';
import { registerLearningSessionsModule } from '../modules/learning-sessions/index.js';
import { registerLiquidityPoolModule } from '../modules/liquidity-pool/index.js';
import { registerLogMinimizerModule } from '../modules/log-minimizer/index.js';
import { registerPaymentSchedulerModule } from '../modules/payment-scheduler/index.js';
import { registerPricingModule } from '../modules/pricing/index.js';
import { registerResourceReservationsModule } from '../modules/resource-reservations/index.js';

export interface RegisteredModule {
  readonly name: string;
  readonly register: (app: FastifyInstance) => Promise<void>;
}

const MODULES: readonly RegisteredModule[] = [
  { name: '_template', register: registerTemplateModule },
  // Existing sandbox-safe bounded contexts.
  { name: 'learning-sessions', register: registerLearningSessionsModule },
  { name: 'contact-requests', register: registerContactRequestsModule },
  { name: 'pricing', register: registerPricingModule },
  // F5 — sandbox-only DDD modules.
  { name: 'audit-logs', register: registerAuditLogsModule },
  { name: 'generated-tokens', register: registerGeneratedTokensModule },
  { name: 'resource-reservations', register: registerResourceReservationsModule },
  // F6 — master-prompt compatibility modules (SANDBOX/MOCK ONLY).
  // These mirror the naming expected by the MASTER PROMPT while preserving
  // the sandbox contract: no real blockchain access, no wallet generation,
  // no custody, no payment execution.
  { name: 'address-generator', register: registerAddressGeneratorModule },
  { name: 'blockchain-monitor', register: registerBlockchainMonitorModule },
  { name: 'deposit-saga', register: registerDepositSagaModule },
  { name: 'liquidity-pool', register: registerLiquidityPoolModule },
  { name: 'log-minimizer', register: registerLogMinimizerModule },
  { name: 'payment-scheduler', register: registerPaymentSchedulerModule },
];

export async function registerModules(app: FastifyInstance): Promise<void> {
  for (const mod of MODULES) {
    app.log.debug({ module: mod.name }, 'registering module');
    await mod.register(app);
  }
  app.log.info(
    { count: MODULES.length, modules: MODULES.map((m) => m.name) },
    'modules registered',
  );
}

export function listRegisteredModules(): readonly string[] {
  return MODULES.map((m) => m.name);
}
