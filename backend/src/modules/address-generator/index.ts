/**
 * Address Generator module composition root — SANDBOX-ONLY.
 *
 * Generates and stores MOCK address tokens. Does NOT create wallets,
 * NOT derive keys, NOT access any blockchain, NOT broadcast tx.
 */
import type { FastifyInstance } from 'fastify';
import { CryptoUuidGenerator } from '../../shared/application/ports/uuid.port.js';
import { GenerateAddressUseCase } from './application/use-cases/generate-address.use-case.js';
import { GetAddressMetadataUseCase } from './application/use-cases/get-address-metadata.use-case.js';
import { RevokeAddressUseCase } from './application/use-cases/revoke-address.use-case.js';
import { InMemoryAddressGeneratorRepository } from './infra/persistence/in-memory-address-generator.repository.js';
import { RandomMockAddressProvider } from './infra/providers/mock-address.provider.js';

export interface AddressGeneratorModule {
  readonly name: 'address-generator';
  readonly generate: GenerateAddressUseCase;
  readonly revoke: RevokeAddressUseCase;
  readonly getMetadata: GetAddressMetadataUseCase;
  readonly repository: InMemoryAddressGeneratorRepository;
}

export async function registerAddressGeneratorModule(app: FastifyInstance): Promise<void> {
  const repository = new InMemoryAddressGeneratorRepository();
  const uuid = new CryptoUuidGenerator();
  const provider = new RandomMockAddressProvider();

  const generate = new GenerateAddressUseCase(repository, uuid, provider);
  const revoke = new RevokeAddressUseCase(repository);
  const getMetadata = new GetAddressMetadataUseCase(repository);

  const module: AddressGeneratorModule = {
    name: 'address-generator',
    generate,
    revoke,
    getMetadata,
    repository,
  };
  (app as unknown as { addressGenerator?: AddressGeneratorModule }).addressGenerator = module;

  app.log.debug(
    { module: 'address-generator', sandbox: true },
    'address-generator module ready (SANDBOX-ONLY, not a wallet, not a blockchain address)',
  );
}
