/**
 * SandboxReservationPolicy.
 *
 * Module-level invariant: NEVER claim to move real funds. Always emits a
 * standard disclaimer alongside any caller-facing payload. Pure.
 */
export const SANDBOX_RESERVATION_DISCLAIMER =
  'Sandbox-only simulation. NO real custody, NO real transfer, NO blockchain interaction.';

export const SandboxReservationPolicy = {
  DISCLAIMER: SANDBOX_RESERVATION_DISCLAIMER,
  /** Returns the standard disclaimer; available as a single source of truth. */
  disclaimer(): string {
    return SANDBOX_RESERVATION_DISCLAIMER;
  },
} as const;
