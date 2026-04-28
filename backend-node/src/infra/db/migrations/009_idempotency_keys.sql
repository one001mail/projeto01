-- 009_idempotency_keys.sql
-- Stores the outcome of an idempotent request keyed by client-supplied key.
-- A request hash is recorded to detect key reuse with different bodies.

CREATE TABLE idempotency_keys (
  key           text        PRIMARY KEY,
  request_hash  text        NOT NULL,
  response_body jsonb,
  status_code   integer,
  expires_at    timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idempotency_keys_expires_at_idx ON idempotency_keys (expires_at);

COMMENT ON TABLE idempotency_keys IS 'Cache of completed idempotent responses; expires_at drives a sweeper job.';
