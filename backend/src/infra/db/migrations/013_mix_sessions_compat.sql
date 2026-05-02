-- 013_mix_sessions_compat.sql
-- MASTER-PROMPT COMPATIBILITY ALIAS — SANDBOX / EDUCATIONAL ONLY.
--
-- The MASTER PROMPT expects a table/concept called `mix_sessions`. The
-- underlying data is stored in the safer `learning_sessions` table (see
-- migration 002). This migration creates a SANDBOX VIEW with the expected
-- name so consumers aligned with the master prompt resolve correctly.
--
-- Contract:
--   * NOT a real mixer.
--   * NOT a deposit system.
--   * Does NOT move money or broadcast transactions.
--   * `status`, `input_value`, `computed_result`, `expires_at` reflect
--     sandbox learning-session state only.

CREATE OR REPLACE VIEW mix_sessions AS
SELECT
  id,
  public_code,
  status,
  subject,
  input_value        AS amount_input,
  computed_result    AS fee_preview,
  NULL::numeric      AS net_preview,
  NULL::integer      AS delay_preview,
  created_at,
  updated_at,
  expires_at
FROM learning_sessions;

COMMENT ON VIEW mix_sessions IS
  'SANDBOX / EDUCATIONAL compatibility view over learning_sessions. '
  'Not a real mixer. No funds moved. No blockchain access.';
