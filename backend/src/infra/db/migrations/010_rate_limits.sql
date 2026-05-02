-- 010_rate_limits.sql
-- Fixed-window rate-limit counters keyed by (key, window_start).
-- The HTTP layer increments the row for the current window; a sweeper job
-- (B4) drops rows whose expires_at is in the past.

CREATE TABLE rate_limits (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key            text        NOT NULL,
  window_start   timestamptz NOT NULL,
  request_count  integer     NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  expires_at     timestamptz NOT NULL,
  CONSTRAINT rate_limits_key_window_uq UNIQUE (key, window_start)
);

CREATE INDEX rate_limits_expires_at_idx ON rate_limits (expires_at);
CREATE INDEX rate_limits_key_idx        ON rate_limits (key);

COMMENT ON TABLE rate_limits IS 'Fixed-window rate-limit counters; eligible for periodic cleanup.';
