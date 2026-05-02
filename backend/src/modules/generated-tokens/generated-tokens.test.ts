/**
 * generated-tokens module — unit + integration tests against the
 * in-memory adapter and the random-token provider.
 */
import { describe, expect, it } from 'vitest';
import { FixedClock } from '../../shared/application/ports/clock.port.js';
import { SequentialUuidGenerator } from '../../shared/application/ports/uuid.port.js';
import { ExpireTokenUseCase } from './application/use-cases/expire-token.use-case.js';
import { GenerateTokenUseCase } from './application/use-cases/generate-token.use-case.js';
import { GetTokenMetadataUseCase } from './application/use-cases/get-token-metadata.use-case.js';
import { RevokeTokenUseCase } from './application/use-cases/revoke-token.use-case.js';
import { MinimalMetadataPolicy } from './domain/policies/minimal-metadata.policy.js';
import {
  SANDBOX_TOKEN_PREFIX,
  SandboxTokenPolicy,
} from './domain/policies/sandbox-token.policy.js';
import { TokenExpirationPolicy } from './domain/policies/token-expiration.policy.js';
import { SandboxToken } from './domain/value-objects/sandbox-token.vo.js';
import { TokenNamespace } from './domain/value-objects/token-namespace.vo.js';
import { InMemoryGeneratedTokenRepository } from './infra/persistence/in-memory-generated-token.repository.js';
import { createRandomSandboxTokenGenerator } from './infra/providers/random-sandbox-token.provider.js';

const NOW = new Date('2025-01-01T00:00:00Z');

describe('generated-tokens domain — sandbox-token policy', () => {
  it('rejects values that do not start with sbx_', () => {
    expect(() => SandboxToken.fromString('not-sandbox')).toThrow();
    expect(() => SandboxToken.fromString('sbX_uppercase')).toThrow();
  });

  it('rejects strings that look like real BTC / ETH addresses', () => {
    expect(SandboxTokenPolicy.looksLikeRealAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe(
      true,
    );
    expect(
      SandboxTokenPolicy.looksLikeRealAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'),
    ).toBe(true);
    expect(
      SandboxTokenPolicy.looksLikeRealAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F'),
    ).toBe(true);
    expect(SandboxTokenPolicy.looksLikeRealAddress('sbx_abcdef')).toBe(false);
  });

  it('rejects strings that look like a hex private key', () => {
    expect(SandboxTokenPolicy.looksLikePrivateKey('a'.repeat(64))).toBe(true);
    expect(SandboxTokenPolicy.looksLikePrivateKey('sbx_short')).toBe(false);
  });

  it('rejects strings that hint at seed phrases', () => {
    expect(SandboxTokenPolicy.looksLikeSeedPhrase('use the seed phrase')).toBe(true);
    expect(SandboxTokenPolicy.looksLikeSeedPhrase('mnemonic to remember')).toBe(true);
    expect(SandboxTokenPolicy.looksLikeSeedPhrase('sbx_safe')).toBe(false);
  });
});

describe('generated-tokens domain — minimal metadata policy', () => {
  it('drops sensitive keys', () => {
    const out = MinimalMetadataPolicy.sanitise({
      ok: 'value',
      authorization: 'Bearer x',
      private_key: 'pk',
      seed: 's',
    });
    expect(Object.keys(out)).toEqual(['ok']);
  });

  it('drops invalid key shapes and bounds total entries', () => {
    const big: Record<string, string> = {};
    for (let i = 0; i < 50; i++) big[`k${i}`] = `v${i}`;
    big['Bad-Key'] = 'no'; // uppercase rejected
    const out = MinimalMetadataPolicy.sanitise(big);
    expect(Object.keys(out).length).toBeLessThanOrEqual(8);
    expect(out['Bad-Key']).toBeUndefined();
  });
});

describe('generated-tokens domain — TokenExpirationPolicy', () => {
  it('returns false when expiresAt is null', () => {
    expect(TokenExpirationPolicy.isExpired(null, NOW)).toBe(false);
  });
  it('returns true when now >= expiresAt', () => {
    expect(TokenExpirationPolicy.isExpired(NOW, NOW)).toBe(true);
    expect(TokenExpirationPolicy.isExpired(new Date(NOW.getTime() - 1), NOW)).toBe(true);
  });
});

describe('generated-tokens infra — random provider', () => {
  it('emits sbx_-prefixed strings that survive policy and value-object validation', () => {
    const gen = createRandomSandboxTokenGenerator();
    for (let i = 0; i < 25; i++) {
      const t = gen.generate();
      expect(t.toString().startsWith(SANDBOX_TOKEN_PREFIX)).toBe(true);
      expect(SandboxTokenPolicy.looksLikeRealAddress(t.toString())).toBe(false);
      expect(SandboxTokenPolicy.looksLikePrivateKey(t.toString())).toBe(false);
      expect(SandboxTokenPolicy.looksLikeSeedPhrase(t.toString())).toBe(false);
    }
  });
});

describe('generated-tokens — generate use case', () => {
  it('rejects invalid namespace', async () => {
    const repo = new InMemoryGeneratedTokenRepository();
    const uc = new GenerateTokenUseCase({
      repo,
      generator: createRandomSandboxTokenGenerator(),
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
    });
    const out = await uc.execute({ namespace: '!invalid!' });
    expect(out.ok).toBe(false);
  });

  it('rejects out-of-range ttlSeconds', async () => {
    const repo = new InMemoryGeneratedTokenRepository();
    const uc = new GenerateTokenUseCase({
      repo,
      generator: createRandomSandboxTokenGenerator(),
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
    });
    const out = await uc.execute({ namespace: 'demo', ttlSeconds: 0 });
    expect(out.ok).toBe(false);
  });

  it('persists, sanitises metadata, returns sandbox DTO', async () => {
    const repo = new InMemoryGeneratedTokenRepository();
    const events: string[] = [];
    const uc = new GenerateTokenUseCase({
      repo,
      generator: createRandomSandboxTokenGenerator(),
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
      outbox: {
        async save(e) {
          events.push(e.name);
          return e.id;
        },
      },
    });
    const out = await uc.execute({
      namespace: 'demo',
      ttlSeconds: 60,
      metadata: { caller: 'test', authorization: 'leaks' },
    });
    expect(out.ok).toBe(true);
    if (!out.ok) throw new Error('unreachable');
    expect(out.value.token.startsWith(SANDBOX_TOKEN_PREFIX)).toBe(true);
    expect(out.value.metadata.caller).toBe('test');
    expect(out.value.metadata.authorization).toBeUndefined();
    expect(out.value.disclaimer).toMatch(/Sandbox-only/);
    expect(repo.size()).toBe(1);
    expect(events).toContain('generated-tokens.token-generated');
  });

  it('does NOT produce strings that resemble blockchain addresses', async () => {
    const repo = new InMemoryGeneratedTokenRepository();
    const uc = new GenerateTokenUseCase({
      repo,
      generator: createRandomSandboxTokenGenerator(),
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
    });
    for (let i = 0; i < 20; i++) {
      const out = await uc.execute({ namespace: 'demo' });
      expect(out.ok).toBe(true);
      if (!out.ok) throw new Error('unreachable');
      expect(SandboxTokenPolicy.looksLikeRealAddress(out.value.token)).toBe(false);
      expect(SandboxTokenPolicy.looksLikePrivateKey(out.value.token)).toBe(false);
      expect(SandboxTokenPolicy.looksLikeSeedPhrase(out.value.token)).toBe(false);
    }
  });
});

describe('generated-tokens — revoke use case', () => {
  it('returns NOT_FOUND when id is unknown', async () => {
    const repo = new InMemoryGeneratedTokenRepository();
    const uc = new RevokeTokenUseCase({
      repo,
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
    });
    const out = await uc.execute({ id: '00000000-0000-4000-8000-000000000123' });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.kind).toBe('NOT_FOUND');
  });

  it('moves an active token to revoked', async () => {
    const repo = new InMemoryGeneratedTokenRepository();
    const generateUc = new GenerateTokenUseCase({
      repo,
      generator: createRandomSandboxTokenGenerator(),
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
    });
    const created = await generateUc.execute({ namespace: 'demo' });
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error('unreachable');

    const revokeUc = new RevokeTokenUseCase({
      repo,
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
    });
    const revoked = await revokeUc.execute({ id: created.value.id });
    expect(revoked.ok).toBe(true);
    if (!revoked.ok) throw new Error('unreachable');
    expect(revoked.value.status).toBe('revoked');

    // Second revoke -> INVALID_STATE
    const again = await revokeUc.execute({ id: created.value.id });
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.error.kind).toBe('INVALID_STATE');
  });
});

describe('generated-tokens — expire and getMetadata', () => {
  it('expire-token transitions on elapsed TTL', async () => {
    const repo = new InMemoryGeneratedTokenRepository();
    const generateUc = new GenerateTokenUseCase({
      repo,
      generator: createRandomSandboxTokenGenerator(),
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
    });
    const created = await generateUc.execute({ namespace: 'demo', ttlSeconds: 1 });
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error('unreachable');

    const later = new Date(NOW.getTime() + 5_000);
    const expireUc = new ExpireTokenUseCase({
      repo,
      clock: new FixedClock(later),
      uuid: new SequentialUuidGenerator(),
    });
    const expired = await expireUc.execute({ id: created.value.id });
    expect(expired.ok).toBe(true);
    if (!expired.ok) throw new Error('unreachable');
    expect(expired.value.status).toBe('expired');
  });

  it('getMetadata refreshes derived status without persisting', async () => {
    const repo = new InMemoryGeneratedTokenRepository();
    const generateUc = new GenerateTokenUseCase({
      repo,
      generator: createRandomSandboxTokenGenerator(),
      clock: new FixedClock(NOW),
      uuid: new SequentialUuidGenerator(),
    });
    const created = await generateUc.execute({ namespace: 'demo', ttlSeconds: 1 });
    if (!created.ok) throw new Error('unreachable');

    const later = new Date(NOW.getTime() + 5_000);
    const getUc = new GetTokenMetadataUseCase(repo, new FixedClock(later));
    const out = await getUc.execute({ id: created.value.id });
    expect(out.ok).toBe(true);
    if (!out.ok) throw new Error('unreachable');
    expect(out.value.status).toBe('expired');
  });

  it('getMetadata rejects non-uuid ids', async () => {
    const repo = new InMemoryGeneratedTokenRepository();
    const getUc = new GetTokenMetadataUseCase(repo, new FixedClock(NOW));
    const out = await getUc.execute({ id: 'nope' });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error.kind).toBe('INVALID_INPUT');
  });
});

describe('generated-tokens — namespace value object', () => {
  it('lowercases input and rejects garbage', () => {
    expect(TokenNamespace.fromString('Demo').toString()).toBe('demo');
    expect(() => TokenNamespace.fromString('1bad')).toThrow();
    expect(() => TokenNamespace.fromString('')).toThrow();
  });
});
