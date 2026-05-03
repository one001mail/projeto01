/**
 * Wallet HTTP schemas (Zod).
 *
 * Strict request schemas for every route. Output schemas intentionally
 * exclude any private-key, seed, or encrypted-secret fields.
 */
import { z } from 'zod';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const NetworkKindSchema = z.enum([
  'ethereum-sepolia',
  'ethereum-mainnet',
  'bitcoin-testnet',
  'bitcoin-mainnet',
]);
export type NetworkKindInput = z.infer<typeof NetworkKindSchema>;

export const ModeSchema = z.enum(['non_custodial', 'custodial']);

export const DecimalMinorSchema = z
  .string()
  .regex(/^[0-9]+$/, 'must be a non-negative integer string (minor units)');

export const CreateWalletBodySchema = z
  .object({
    ownerRef: z.string().trim().min(1).max(256),
    mode: ModeSchema.optional(),
    supportedNetworks: z.array(NetworkKindSchema).min(1).max(8),
    custodyKeyRef: z.string().min(1).max(200).optional().nullable(),
    label: z.string().trim().max(100).optional().nullable(),
  })
  .strict();

export const GenerateAddressBodySchema = z
  .object({
    network: NetworkKindSchema,
    asset: z.string().trim().max(10).optional().nullable(),
  })
  .strict();

export const PrepareTransactionBodySchema = z
  .object({
    network: NetworkKindSchema,
    fromAddress: z.string().trim().min(1),
    toAddress: z.string().trim().min(1),
    asset: z.string().trim().min(1).max(10),
    amount: DecimalMinorSchema,
    maxAmountPerTx: DecimalMinorSchema.optional().nullable(),
  })
  .strict();

export const BroadcastTransactionBodySchema = z
  .object({
    transactionId: z.string().regex(UUID_RE, 'transactionId must be UUID'),
    signedRawTx: z
      .string()
      .regex(/^(0x)?[0-9a-fA-F]+$/)
      .min(8)
      .max(200_000),
  })
  .strict();

export const WalletIdParamSchema = z
  .object({ walletId: z.string().regex(UUID_RE, 'walletId must be UUID') })
  .strict();

export const WalletAddressParamSchema = z
  .object({
    walletId: z.string().regex(UUID_RE, 'walletId must be UUID'),
    address: z.string().trim().min(1),
  })
  .strict();

export type CreateWalletBody = z.infer<typeof CreateWalletBodySchema>;
export type GenerateAddressBody = z.infer<typeof GenerateAddressBodySchema>;
export type PrepareTransactionBody = z.infer<typeof PrepareTransactionBodySchema>;
export type BroadcastTransactionBody = z.infer<typeof BroadcastTransactionBodySchema>;
