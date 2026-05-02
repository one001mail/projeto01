-- 014_generated_addresses_compat.sql
-- MASTER-PROMPT COMPATIBILITY ALIAS — SANDBOX / MOCK ONLY.
--
-- Exposes the existing `generated_tokens` table under the master-prompt
-- name `generated_addresses`. Clearly documented: these rows are MOCK
-- address tokens, NOT wallets, NOT blockchain addresses, NOT spendable.

CREATE OR REPLACE VIEW generated_addresses AS
SELECT
  id,
  token              AS mock_address_token,
  namespace,
  metadata_minimized AS metadata,
  created_at,
  expires_at,
  status,
  FALSE              AS is_real_wallet,
  FALSE              AS is_blockchain_address,
  FALSE              AS is_spendable
FROM generated_tokens;

COMMENT ON VIEW generated_addresses IS
  'SANDBOX / MOCK compatibility view over generated_tokens. '
  'Not a wallet. Not a blockchain address. Not spendable.';
