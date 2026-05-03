/**
 * Wallet module smoke test.
 *
 * Builds a Fastify app, registers the wallet module, and exercises the
 * public routes end-to-end against the in-memory adapters. The test does
 * NOT hit any real blockchain RPC: every provider call is skipped
 * because `ETHEREUM_RPC_URL` / `BITCOIN_RPC_URL` are left unset in the
 * test environment.
 */
import Fastify from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerErrorHandler } from '../../api/http/error-handler.js';
import { _resetWalletConfigForTests } from './infra/config/wallet.config.js';
import { registerWalletModule } from './index.js';

describe('wallet module (smoke)', () => {
  const app = Fastify({ logger: false });

  beforeAll(async () => {
    _resetWalletConfigForTests();
    // Ensure a deterministic environment for the wallet module.
    process.env.WALLET_DEFAULT_MODE = 'non_custodial';
    process.env.WALLET_ENABLE_MAINNET = 'false';
    process.env.WALLET_AUDIT_LOG_ENABLED = 'false';
    delete process.env.ETHEREUM_RPC_URL;
    delete process.env.BITCOIN_RPC_URL;
    delete process.env.WALLET_ENCRYPTION_KEY;
    registerErrorHandler(app);
    await registerWalletModule(app);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a wallet, generates an address, and refuses mainnet', async () => {
    // CREATE wallet on testnets only.
    const create = await app.inject({
      method: 'POST',
      url: '/api/wallets',
      payload: {
        ownerRef: 'user-42',
        supportedNetworks: ['ethereum-sepolia', 'bitcoin-testnet'],
      },
    });
    expect(create.statusCode).toBe(201);
    const createdBody = create.json() as { wallet: { id: string; mode: string } };
    expect(createdBody.wallet.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(createdBody.wallet.mode).toBe('non_custodial');

    const walletId = createdBody.wallet.id;

    // GET metadata contains no secret fields.
    const meta = await app.inject({ method: 'GET', url: `/api/wallets/${walletId}` });
    expect(meta.statusCode).toBe(200);
    const metaJson = meta.payload;
    expect(metaJson).not.toMatch(/privateKey|mnemonic|seedPhrase|xpriv/i);

    // GENERATE ethereum sepolia address.
    const gen = await app.inject({
      method: 'POST',
      url: `/api/wallets/${walletId}/addresses`,
      payload: { network: 'ethereum-sepolia' },
    });
    expect(gen.statusCode).toBe(201);
    const genBody = gen.json() as {
      address: { address: string; network: string; asset: string };
    };
    expect(genBody.address.network).toBe('ethereum-sepolia');
    expect(genBody.address.asset).toBe('ETH');
    expect(genBody.address.address).toMatch(/^0x[0-9a-f]{40}$/);

    // REFUSE mainnet when WALLET_ENABLE_MAINNET is false.
    const mainnetCreate = await app.inject({
      method: 'POST',
      url: '/api/wallets',
      payload: {
        ownerRef: 'user-42',
        supportedNetworks: ['ethereum-mainnet'],
      },
    });
    expect(mainnetCreate.statusCode).toBe(403);
    expect(mainnetCreate.payload.toLowerCase()).toContain('mainnet');
  });

  it('rejects any request carrying forbidden private-key fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/wallets',
      payload: {
        ownerRef: 'user-X',
        supportedNetworks: ['bitcoin-testnet'],
        // Zod schema will reject unknown fields via .strict()
        privateKey: '0xdeadbeef',
      },
    });
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });
});
