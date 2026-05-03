/**
 * Wallet module configuration.
 *
 * Validates wallet-specific environment variables at composition time.
 * Lives in `infra/config/` so it can safely use `process.env`, zod, and
 * emit redacted startup logs. Never stores or prints secrets.
 */
import { z } from 'zod';

const boolish = z
  .union([z.string(), z.boolean()])
  .transform((v) =>
    typeof v === 'boolean' ? v : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase()),
  );

const WalletConfigSchema = z
  .object({
    WALLET_DEFAULT_MODE: z.enum(['non_custodial', 'custodial']).default('non_custodial'),
    WALLET_ENABLE_MAINNET: boolish.default(false),
    WALLET_AUDIT_LOG_ENABLED: boolish.default(true),

    // Ethereum
    ETHEREUM_RPC_URL: z.string().url().optional(),
    ETHEREUM_CHAIN_ID: z.coerce.number().int().positive().optional(),

    // Bitcoin
    BITCOIN_NETWORK: z.enum(['testnet', 'mainnet']).default('testnet'),
    BITCOIN_RPC_URL: z.string().optional(),

    // Custodial/KMS
    WALLET_ENCRYPTION_KEY: z
      .string()
      .min(32, 'WALLET_ENCRYPTION_KEY must be at least 32 chars (base64 of 32 bytes recommended)')
      .optional(),

    // Safety limits (minor units, decimal strings).
    WALLET_MAX_AMOUNT_PER_TX: z
      .string()
      .regex(/^[0-9]+$/)
      .default('100000000000000000000'),
  })
  .refine(
    (cfg) =>
      cfg.WALLET_DEFAULT_MODE === 'non_custodial' ||
      (cfg.WALLET_DEFAULT_MODE === 'custodial' && !!cfg.WALLET_ENCRYPTION_KEY),
    { message: 'WALLET_ENCRYPTION_KEY is required when WALLET_DEFAULT_MODE=custodial' },
  );

export type WalletConfig = z.infer<typeof WalletConfigSchema>;

let cached: WalletConfig | undefined;

export function loadWalletConfig(env: NodeJS.ProcessEnv = process.env): WalletConfig {
  if (cached) return cached;
  const parsed = WalletConfigSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n  ');
    throw new Error(`Invalid wallet module configuration:\n  ${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export function _resetWalletConfigForTests(): void {
  cached = undefined;
}

/** Safe printable summary — NEVER includes secrets. */
export function summarizeWalletConfig(cfg: WalletConfig): Record<string, unknown> {
  return {
    defaultMode: cfg.WALLET_DEFAULT_MODE,
    mainnetEnabled: cfg.WALLET_ENABLE_MAINNET,
    auditLogEnabled: cfg.WALLET_AUDIT_LOG_ENABLED,
    ethereumRpcConfigured: !!cfg.ETHEREUM_RPC_URL,
    ethereumChainId: cfg.ETHEREUM_CHAIN_ID ?? null,
    bitcoinNetwork: cfg.BITCOIN_NETWORK,
    bitcoinRpcConfigured: !!cfg.BITCOIN_RPC_URL,
    encryptionKeyConfigured: !!cfg.WALLET_ENCRYPTION_KEY,
    maxAmountPerTx: cfg.WALLET_MAX_AMOUNT_PER_TX,
  };
}
