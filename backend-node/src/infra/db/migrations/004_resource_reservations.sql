-- 004_resource_reservations.sql
-- Generic resource allocations attached to a learning session.
-- The `amount` is unitless in this sandbox — it represents a quota slot,
-- not money or any blockchain unit.

CREATE TABLE resource_reservations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid        NOT NULL REFERENCES learning_sessions (id) ON DELETE CASCADE,
  status      text        NOT NULL DEFAULT 'reserved'
                          CHECK (status IN ('reserved', 'released', 'expired')),
  amount      numeric(20, 6) NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz
);

CREATE INDEX resource_reservations_session_id_idx ON resource_reservations (session_id);
CREATE INDEX resource_reservations_status_idx     ON resource_reservations (status);

COMMENT ON TABLE  resource_reservations IS 'Sandbox resource allocations per learning session.';
COMMENT ON COLUMN resource_reservations.amount IS 'Unitless sandbox quota; not a financial amount.';
