-- 002_learning_sessions.sql
-- Sandbox domain: a user-created learning session. Neutral, non-financial.
-- `public_code` is a short, opaque, URL-safe identifier shown to the user.
-- `expires_at` reflects session lifetime, not log retention.

CREATE TABLE learning_sessions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  public_code     text        NOT NULL UNIQUE,
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'active', 'completed', 'expired')),
  subject         text,
  input_value     numeric(20, 6),
  computed_result numeric(20, 6),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz
);

CREATE INDEX learning_sessions_status_idx     ON learning_sessions (status);
CREATE INDEX learning_sessions_expires_at_idx ON learning_sessions (expires_at)
  WHERE expires_at IS NOT NULL;

CREATE TRIGGER learning_sessions_set_updated_at
  BEFORE UPDATE ON learning_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE  learning_sessions IS 'Sandbox learning sessions (neutral domain example).';
COMMENT ON COLUMN learning_sessions.public_code IS 'Short opaque code surfaced to the user.';
