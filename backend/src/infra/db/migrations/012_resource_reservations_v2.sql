-- 012_resource_reservations_v2.sql
-- F5: extend `resource_reservations` to fully support the new
-- `resource-reservations` DDD module:
--   * `namespace` (text) — sandbox bucket the reservation belongs to.
--   * `expires_at` (timestamptz) — TTL for reconcile sweeps.
--   * `updated_at` (timestamptz) — driven by the existing
--     `set_updated_at()` trigger (created in 001_init.sql).
--   * Allow the new `'failed'` status.
--
-- Non-destructive: ADD COLUMN IF NOT EXISTS, no DROP, no DELETE.

ALTER TABLE resource_reservations
  ADD COLUMN IF NOT EXISTS namespace  text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill `namespace` for any pre-existing rows so the new NOT NULL works
-- safely on fresh deployments. The default keeps legacy rows compatible.
UPDATE resource_reservations
SET namespace = COALESCE(namespace, 'sandbox.legacy')
WHERE namespace IS NULL;

ALTER TABLE resource_reservations
  ALTER COLUMN namespace SET DEFAULT 'sandbox.default',
  ALTER COLUMN namespace SET NOT NULL;

-- Replace the status check to include the new `'failed'` lifecycle state.
ALTER TABLE resource_reservations
  DROP CONSTRAINT IF EXISTS resource_reservations_status_check;

ALTER TABLE resource_reservations
  ADD CONSTRAINT resource_reservations_status_check
  CHECK (status IN ('reserved', 'released', 'expired', 'failed'));

-- Helpful indexes.
CREATE INDEX IF NOT EXISTS resource_reservations_namespace_idx
  ON resource_reservations (namespace);
CREATE INDEX IF NOT EXISTS resource_reservations_expires_at_idx
  ON resource_reservations (expires_at)
  WHERE expires_at IS NOT NULL;

-- Wire `updated_at` to the shared trigger so subsequent updates bump it.
DROP TRIGGER IF EXISTS resource_reservations_set_updated_at ON resource_reservations;
CREATE TRIGGER resource_reservations_set_updated_at
  BEFORE UPDATE ON resource_reservations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON COLUMN resource_reservations.namespace IS
  'Sandbox bucket; isolates reservations across simulated allocations.';
COMMENT ON COLUMN resource_reservations.expires_at IS
  'Optional TTL; reconcile sweep transitions reserved -> expired.';
