-- 015_pool_reservations_compat.sql
-- MASTER-PROMPT COMPATIBILITY ALIAS — SANDBOX / MOCK ONLY.
--
-- Exposes the existing `resource_reservations` table under the master-
-- prompt name `pool_reservations`. These rows describe MOCK unitless
-- "slots" in a simulated liquidity pool — NOT real liquidity, NOT balance
-- movement, NOT custody.

CREATE OR REPLACE VIEW pool_reservations AS
SELECT
  id,
  amount,
  status,
  expires_at,
  updated_at,
  namespace,
  FALSE AS is_real_liquidity,
  FALSE AS moves_funds
FROM resource_reservations;

COMMENT ON VIEW pool_reservations IS
  'SANDBOX / MOCK compatibility view over resource_reservations. '
  'No real liquidity. No balance movement. No custody.';
