/**
 * System clock adapter.
 *
 * Thin wrapper over `Date` so infra code reads time through one seam.
 * The pure Clock port lives in `shared/application/ports/clock.port.ts`.
 */
import { SystemClock as SharedSystemClock } from '../../shared/application/ports/clock.port.js';

export class SystemClock extends SharedSystemClock {}

export const systemClock = new SystemClock();
