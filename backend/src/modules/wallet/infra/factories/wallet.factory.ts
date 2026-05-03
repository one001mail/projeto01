/**
 * Wallet module composition factory.
 *
 * Builds all module-local dependencies (repositories, providers, security
 * services, domain services) and wires them into the application
 * use cases. The factory is the single source of truth for module
 * construction; `index.ts` calls it and registers HTTP routes.
 */
import type { FastifyBaseLogger } from 'fastify';
import { SystemClock } from '../../../../shared/application/ports/clock.port.js';
import { CryptoUuidGenerator } from '../../../../shared/application/ports/uuid.port.js';
import { BroadcastTransactionUseCase } from '../../application/use-cases/broadcast-transaction.use-case.js';
import { CreateWalletUseCase } from '../../application/use-cases/create-wallet.use-case.js';
import { GenerateAddressUseCase } from '../../application/use-cases/generate-address.use-case.js';
import { GetAddressBalanceUseCase } from '../../application/use-cases/get-address-balance.use-case.js';
import { GetWalletMetadataUseCase } from '../../application/use-cases/get-wallet-metadata.use-case.js';
import { PrepareTransactionUseCase } from '../../application/use-cases/prepare-transaction.use-case.js';
import { SyncWalletBalancesUseCase } from '../../application/use-cases/sync-wallet-balances.use-case.js';
import { MainnetGatePolicy } from '../../domain/policies/mainnet-gate.policy.js';
import { AddressDerivationService } from '../../domain/services/address-derivation.service.js';
import { TransactionPolicyService } from '../../domain/services/transaction-policy.service.js';
import { WalletDomainService } from '../../domain/services/wallet-domain.service.js';
import { type WalletConfig, loadWalletConfig } from '../config/wallet.config.js';
import { InMemoryBlockchainTransactionRepository } from '../persistence/in-memory-blockchain-transaction.repository.js';
import { InMemoryWalletAddressRepository } from '../persistence/in-memory-wallet-address.repository.js';
import { InMemoryWalletRepository } from '../persistence/in-memory-wallet.repository.js';
import { BitcoinRpcProvider } from '../providers/bitcoin-rpc.provider.js';
import type { BlockchainProvider } from '../providers/blockchain-provider.js';
import { EthereumRpcProvider } from '../providers/ethereum-rpc.provider.js';
import type { KeyManagementProvider } from '../providers/key-management.provider.js';
import { LocalEncryptedKeyManagementProvider } from '../providers/local-encrypted-key-management.provider.js';
import { DefaultPublicAddressDerivationProvider } from '../providers/public-address-derivation.provider.js';
import { AuditLogService } from '../security/audit-log.service.js';
import { EncryptionService } from '../security/encryption.service.js';

export interface BuiltWalletModule {
  readonly config: WalletConfig;
  readonly useCases: {
    readonly createWallet: CreateWalletUseCase;
    readonly generateAddress: GenerateAddressUseCase;
    readonly getWalletMetadata: GetWalletMetadataUseCase;
    readonly getAddressBalance: GetAddressBalanceUseCase;
    readonly prepareTransaction: PrepareTransactionUseCase;
    readonly broadcastTransaction: BroadcastTransactionUseCase;
    readonly syncWalletBalances: SyncWalletBalancesUseCase;
  };
  readonly repositories: {
    readonly wallet: InMemoryWalletRepository;
    readonly address: InMemoryWalletAddressRepository;
    readonly transaction: InMemoryBlockchainTransactionRepository;
  };
  readonly providers: {
    readonly ethereum: BlockchainProvider;
    readonly bitcoin: BlockchainProvider;
    readonly keyManagement: KeyManagementProvider | null;
    readonly derivation: DefaultPublicAddressDerivationProvider;
  };
  readonly services: {
    readonly audit: AuditLogService;
  };
}

export interface WalletFactoryOptions {
  readonly logger?: FastifyBaseLogger;
  readonly env?: NodeJS.ProcessEnv;
}

export function buildWalletModule(options: WalletFactoryOptions = {}): BuiltWalletModule {
  const config = loadWalletConfig(options.env);

  // Repositories — in-memory dev adapters. Swap with Postgres in production.
  const walletRepo = new InMemoryWalletRepository();
  const addressRepo = new InMemoryWalletAddressRepository();
  const txRepo = new InMemoryBlockchainTransactionRepository();

  // Providers
  const ethereum = new EthereumRpcProvider({
    rpcUrl: config.ETHEREUM_RPC_URL ?? null,
    chainId: config.ETHEREUM_CHAIN_ID ?? null,
  });
  const bitcoin = new BitcoinRpcProvider({
    rpcUrl: config.BITCOIN_RPC_URL ?? null,
    network: config.BITCOIN_NETWORK,
  });

  let keyManagement: KeyManagementProvider | null = null;
  if (config.WALLET_ENCRYPTION_KEY) {
    const encryption = new EncryptionService(config.WALLET_ENCRYPTION_KEY);
    keyManagement = new LocalEncryptedKeyManagementProvider(encryption);
  }

  const derivation = new DefaultPublicAddressDerivationProvider({
    keyManagement,
    mainnetEnabled: config.WALLET_ENABLE_MAINNET,
  });

  // Domain services + policies
  const mainnetGate = new MainnetGatePolicy(config.WALLET_ENABLE_MAINNET);
  const addressDerivation = new AddressDerivationService();
  const transactionPolicy = new TransactionPolicyService();
  const walletDomain = new WalletDomainService(mainnetGate);

  const audit = new AuditLogService({
    enabled: config.WALLET_AUDIT_LOG_ENABLED,
    ...(options.logger ? { logger: options.logger } : {}),
  });

  // Ports — simple bridges from BlockchainProvider to the use-case ports.
  const balanceReader = {
    async getBalance(input: { network: string; address: string; asset: string }) {
      const provider = input.network.startsWith('ethereum') ? ethereum : bitcoin;
      return provider.getBalance({ address: input.address, asset: input.asset });
    },
  };
  const txBuilder = {
    async buildUnsigned(input: {
      network: string;
      from: string;
      to: string;
      asset: string;
      amount: string;
    }) {
      const provider = input.network.startsWith('ethereum') ? ethereum : bitcoin;
      return provider.buildUnsigned(input);
    },
  };
  const txBroadcaster = {
    async broadcast(input: { network: string; signedRawTx: string }) {
      const provider = input.network.startsWith('ethereum') ? ethereum : bitcoin;
      return provider.broadcast(input.signedRawTx);
    },
  };

  const clock = new SystemClock();
  const uuid = new CryptoUuidGenerator();

  const createWallet = new CreateWalletUseCase({
    walletRepo,
    uuid,
    clock,
    domain: walletDomain,
    defaultMode: config.WALLET_DEFAULT_MODE,
    mainnetEnabled: config.WALLET_ENABLE_MAINNET,
    audit,
  });

  const generateAddress = new GenerateAddressUseCase({
    walletRepo,
    addressRepo,
    uuid,
    clock,
    deriver: derivation,
    derivationService: addressDerivation,
    mainnetGate,
    audit,
  });

  const getWalletMetadata = new GetWalletMetadataUseCase({
    walletRepo,
    addressRepo,
  });

  const getAddressBalance = new GetAddressBalanceUseCase({
    walletRepo,
    addressRepo,
    reader: balanceReader,
    clock,
  });

  const prepareTransaction = new PrepareTransactionUseCase({
    walletRepo,
    addressRepo,
    txRepo,
    builder: txBuilder,
    uuid,
    clock,
    policy: transactionPolicy,
    mainnetGate,
    defaultMaxAmountPerTx: config.WALLET_MAX_AMOUNT_PER_TX,
    audit,
  });

  const broadcastTransaction = new BroadcastTransactionUseCase({
    walletRepo,
    txRepo,
    broadcaster: txBroadcaster,
    clock,
    audit,
  });

  const syncWalletBalances = new SyncWalletBalancesUseCase({
    walletRepo,
    addressRepo,
    reader: balanceReader,
    clock,
    audit,
  });

  return {
    config,
    useCases: {
      createWallet,
      generateAddress,
      getWalletMetadata,
      getAddressBalance,
      prepareTransaction,
      broadcastTransaction,
      syncWalletBalances,
    },
    repositories: {
      wallet: walletRepo,
      address: addressRepo,
      transaction: txRepo,
    },
    providers: {
      ethereum,
      bitcoin,
      keyManagement,
      derivation,
    },
    services: {
      audit,
    },
  };
}
