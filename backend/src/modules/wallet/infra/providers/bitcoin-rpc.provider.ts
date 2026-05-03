/**
 * BitcoinRpcProvider.
 *
 * Minimal JSON-RPC client for a bitcoind-compatible node. Implements
 * `BlockchainProvider`. The `buildUnsigned` path returns a stub PSBT-like
 * payload: real UTXO selection, change calculation, and PSBT finalization
 * require a full wallet node or indexer integration and are intentionally
 * routed through a richer provider implementation in production.
 */
import type { FeeData } from '../../domain/entities/blockchain-transaction.entity.js';
import {
  type BlockchainProvider,
  BlockchainProviderError,
  type BroadcastResult,
  type BuildUnsignedInput,
  type BuildUnsignedResult,
  type GetBalanceInput,
  type GetBalanceResult,
} from './blockchain-provider.js';

export interface BitcoinRpcOptions {
  readonly rpcUrl: string | null;
  readonly network: 'testnet' | 'mainnet';
  readonly timeoutMs?: number;
}

export class BitcoinRpcProvider implements BlockchainProvider {
  readonly family = 'bitcoin' as const;
  readonly networkName: string;

  constructor(private readonly opts: BitcoinRpcOptions) {
    this.networkName = `bitcoin-${opts.network}`;
  }

  isConfigured(): boolean {
    return !!this.opts.rpcUrl;
  }

  private async call<T>(method: string, params: readonly unknown[]): Promise<T> {
    if (!this.opts.rpcUrl) {
      throw new BlockchainProviderError(
        'Bitcoin RPC not configured (BITCOIN_RPC_URL missing)',
        this.networkName,
      );
    }
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), this.opts.timeoutMs ?? 8000);
    try {
      const res = await fetch(this.opts.rpcUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '1.0', id: 'wallet', method, params }),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new BlockchainProviderError(
          `RPC HTTP ${res.status} on ${method}`,
          this.networkName,
          res.status,
        );
      }
      const body = (await res.json()) as { result?: T; error?: { message: string } };
      if (body.error) {
        throw new BlockchainProviderError(
          `RPC error on ${method}: ${body.error.message}`,
          this.networkName,
        );
      }
      if (body.result === undefined) {
        throw new BlockchainProviderError(
          `RPC returned empty result for ${method}`,
          this.networkName,
        );
      }
      return body.result;
    } finally {
      clearTimeout(t);
    }
  }

  async getBalance(input: GetBalanceInput): Promise<GetBalanceResult> {
    // Uses `scantxoutset` which works on bitcoind without importing the
    // address into a wallet file. Returned BTC is converted to satoshis.
    try {
      const res = await this.call<{ total_amount: number; success?: boolean }>('scantxoutset', [
        'start',
        [`addr(${input.address})`],
      ]);
      const satsFloat = (res.total_amount ?? 0) * 1e8;
      const sats = BigInt(Math.round(satsFloat));
      return { confirmed: sats.toString(10), pending: '0' };
    } catch (e) {
      // If scantxoutset is not available, return zeros rather than leaking
      // error internals into a public API response.
      if (e instanceof BlockchainProviderError) throw e;
      throw new BlockchainProviderError(
        e instanceof Error ? e.message : 'bitcoin balance lookup failed',
        this.networkName,
      );
    }
  }

  async buildUnsigned(input: BuildUnsignedInput): Promise<BuildUnsignedResult> {
    // Production: use a PSBT-aware library (bitcoinjs-lib) or a wallet node.
    // This MVP returns a structured envelope so the signer has what it needs.
    const envelope = {
      network: this.opts.network,
      from: input.from,
      to: input.to,
      asset: input.asset,
      amountSatoshis: input.amount,
      feeSatVb: 10,
    };
    const fee: FeeData = {
      feeAsset: 'BTC',
      feeAmount: '1500', // placeholder 1500 sats; signer recomputes on real build
      gasLimit: null,
      gasPrice: null,
    };
    const unsignedPayload = Buffer.from(JSON.stringify(envelope), 'utf8').toString('hex');
    return { unsignedPayload, fee };
  }

  async broadcast(signedRawTx: string): Promise<BroadcastResult> {
    const txHash = await this.call<string>('sendrawtransaction', [signedRawTx]);
    return { txHash };
  }
}
