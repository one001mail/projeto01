/**
 * Poll-blockchain job definition — SANDBOX / MOCK ONLY.
 *
 * DOES NOT connect to Bitcoin, Ethereum, mempool, RPC endpoints, block
 * explorers, or any third-party blockchain service. The handler emits
 * synthetic MOCK observations only.
 *
 * Kept as a job definition for architectural parity with the MASTER
 * PROMPT. The blockchain-monitor module exposes the actual use case.
 */
export interface PollBlockchainJobInput {
  readonly batchSize?: number;
}

export const pollBlockchainJob = {
  name: 'poll-blockchain' as const,
  sandbox: true as const,
  /**
   * Pure mock handler. Returns an empty observation array by default.
   */
  async handle(
    _input: PollBlockchainJobInput,
  ): Promise<{ observations: readonly never[]; mock: true }> {
    return { observations: [] as const, mock: true as const };
  },
};
