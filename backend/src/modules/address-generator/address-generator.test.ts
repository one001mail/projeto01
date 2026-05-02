import { describe, expect, it } from 'vitest';
import { GenerateAddressUseCase } from './application/use-cases/generate-address.use-case.js';
import { GetAddressMetadataUseCase } from './application/use-cases/get-address-metadata.use-case.js';
import { RevokeAddressUseCase } from './application/use-cases/revoke-address.use-case.js';
import { InMemoryAddressGeneratorRepository } from './infra/persistence/in-memory-address-generator.repository.js';
import { RandomMockAddressProvider } from './infra/providers/mock-address.provider.js';

describe('address-generator module (SANDBOX-ONLY)', () => {
  const uuid = {
    n: 0,
    v4(): string {
      this.n += 1;
      return `00000000-0000-4000-8000-${String(this.n).padStart(12, '0')}`;
    },
  };

  it('issues a mock sbx_* token and stores it', async () => {
    const repo = new InMemoryAddressGeneratorRepository();
    const uc = new GenerateAddressUseCase(repo, uuid, new RandomMockAddressProvider());
    const result = await uc.execute({ namespace: 'demo', correlationId: 'corr-1' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.token.startsWith('sbx_')).toBe(true);
    expect(result.value.namespace).toBe('demo');
    expect(result.value.disclaimer).toMatch(/SANDBOX/);
  });

  it('revokes a token', async () => {
    const repo = new InMemoryAddressGeneratorRepository();
    const gen = new GenerateAddressUseCase(repo, uuid, new RandomMockAddressProvider());
    const rev = new RevokeAddressUseCase(repo);
    const gres = await gen.execute({ namespace: 'demo' });
    if (!gres.ok) throw new Error('expected ok');
    const r = await rev.execute({ id: gres.value.id });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status).toBe('revoked');
  });

  it('returns NOT_FOUND for missing id', async () => {
    const repo = new InMemoryAddressGeneratorRepository();
    const uc = new GetAddressMetadataUseCase(repo);
    const r = await uc.execute({ id: 'nope' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('NOT_FOUND');
  });
});
