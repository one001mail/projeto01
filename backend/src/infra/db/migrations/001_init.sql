-- 001_init.sql
-- Bootstrap extensions and shared helpers used by all subsequent migrations.
-- Idempotent: safe to apply once, will fail at the runner level on re-apply.

CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;       -- case-insensitive text where useful

-- Shared trigger function for `updated_at` columns. Tables that opt in attach
-- a BEFORE UPDATE trigger that calls this function.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION set_updated_at() IS 'Generic BEFORE UPDATE trigger to maintain updated_at timestamps.';
