/**
 * UUID v4 generator (infra).
 *
 * Concrete adapter. Pure UUID port lives in
 * `shared/application/ports/uuid.port.ts`.
 */
import { CryptoUuidGenerator } from '../../shared/application/ports/uuid.port.js';

export class UuidGenerator extends CryptoUuidGenerator {}

export const uuidGenerator = new UuidGenerator();
