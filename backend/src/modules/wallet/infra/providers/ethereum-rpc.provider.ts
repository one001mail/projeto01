/**
 * EthereumRpcProvider.
 *
 * Minimal JSON-RPC 2.0 client over fetch() that implements
 * `BlockchainProvider`. Targets any EVM-compatible network (Sepolia by
 * default, Mainnet if explicitly enabled). Does NOT sign: signing is a
 * KeyManagementProvider concern and stays outside this module.
 *
 * Supported methods here:
 *   eth_getBalance              — confirmed balance
 *   eth_getTransactionCount     — nonce (for unsigned tx)
 *   eth_gasPrice / eth_feeHistory — fee estimation
 *   eth_sendRawTransaction      — broadcast
 *
 * The unsigned payload returned by `buildUnsigned` is an RLP-free JSON
 * envelope (nonce, to, value, gas, maxFeePerGas, chainId) that the
 * caller's signer must RLP-encode and sign. This keeps the provider
 * implementation dependency-free; production deployments can swap this
 * for an ethers.js-backed adapter.
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

export interface EthereumRpcOptions {
  readonly rpcUrl: string | null;
  readonly chainId: number | null;
  readonly timeoutMs?: number;
}

interface JsonRpcResponse<T> {
  jsonrpc?: string;
  id?: number | string;
  result?: T;
  error?: { code: number; message: string };
}

export class EthereumRpcProvider implements BlockchainProvider {
  readonly family = 'ethereum' as const;
  readonly networkName: string;

  constructor(private readonly opts: EthereumRpcOptions) {
    this.networkName = `ethereum(chainId=${opts.chainId ?? 'n/a'})`;
  }

  isConfigured(): boolean {
    return !!this.opts.rpcUrl;
  }

  private async call<T>(method: string, params: readonly unknown[]): Promise<T> {
    if (!this.opts.rpcUrl) {
      throw new BlockchainProviderError(
        'Ethereum RPC not configured (ETHEREUM_RPC_URL missing)',
        this.networkName,
      );
    }
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), this.opts.timeoutMs ?? 8000);
    try {
      const res = await fetch(this.opts.rpcUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new BlockchainProviderError(
          `RPC HTTP ${res.status} on ${method}`,
          this.networkName,
          res.status,
        );
      }
      const body = (await res.json()) as JsonRpcResponse<T>;
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
    // Native ETH via eth_getBalance. Tokens would require eth_call to ERC-20.
    if (input.asset.toUpperCase() !== 'ETH') {
      // Out-of-scope for this MVP; return zeros so callers can detect.
      return { confirmed: '0', pending: '0' };
    }
    const hex = await this.call<string>('eth_getBalance', [input.address, 'latest']);
    const pendingHex = await this.call<string>('eth_getBalance', [input.address, 'pending']);
    return {
      confirmed: BigInt(hex).toString(10),
      pending: BigInt(pendingHex).toString(10),
    };
  }

  async buildUnsigned(input: BuildUnsignedInput): Promise<BuildUnsignedResult> {
    if (input.asset.toUpperCase() !== 'ETH') {
      throw new BlockchainProviderError(
        `Unsupported asset for Ethereum native transfer: ${input.asset}`,
        this.networkName,
      );
    }
    const nonce = await this.call<string>('eth_getTransactionCount', [input.from, 'pending']);
    const gasPrice = await this.call<string>('eth_gasPrice', []);
    const chainIdHex =
      this.opts.chainId !== null ? `0x${this.opts.chainId.toString(16)}` : '0xaa36a7'; // Sepolia fallback
    const envelope = {
      type: '0x2',
      chainId: chainIdHex,
      nonce,
      to: input.to,
      value: `0x${BigInt(input.amount).toString(16)}`,
      gas: '0x5208', // 21000, basic transfer
      maxFeePerGas: gasPrice,
      maxPriorityFeePerGas: gasPrice,
      data: '0x',
    };
    const fee: FeeData = {
      feeAsset: 'ETH',
      feeAmount: (BigInt(gasPrice) * 21000n).toString(10),
      gasLimit: '21000',
      maxFeePerGas: BigInt(gasPrice).toString(10),
      maxPriorityFeePerGas: BigInt(gasPrice).toString(10),
    };
    // JSON-encode then hex-encode as an opaque payload. Signer deserializes.
    const json = JSON.stringify(envelope);
    const unsignedPayload = Buffer.from(json, 'utf8').toString('hex');
    return { unsignedPayload, fee };
  }

  async broadcast(signedRawTx: string): Promise<BroadcastResult> {
    const txHash = await this.call<string>('eth_sendRawTransaction', [signedRawTx]);
    return { txHash };
  }
}
