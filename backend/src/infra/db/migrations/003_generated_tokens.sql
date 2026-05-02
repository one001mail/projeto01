-- 003_generated_tokens.sql
-- Generic short-lived sandbox tokens (e.g. invite tokens, lookup keys).
-- `metadata_minimized` is a JSONB blob intended to hold ONLY the minimum
-- non-sensitive fields the application needs for token resolution.

CREATE TABLE generated_tokens (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  namespace           text        NOT NULL,
  token               text        NOT NULL,
  status              text        NOT NULL DEFAULT 'active'
                                  CHECK (status IN ('active', 'revoked', 'expired')),
  metadata_minimized  jsonb       NOT NULL DEFAULT '{}'::jsonb,
  expires_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT generated_tokens_namespace_token_uq UNIQUE (namespace, token)
);

CREATE INDEX generated_tokens_status_idx     ON generated_tokens (status);
CREATE INDEX generated_tokens_expires_at_idx ON generated_tokens (expires_at)
  WHERE expires_at IS NOT NULL;

COMMENT ON TABLE  generated_tokens IS 'Generic sandbox tokens scoped by namespace.';
COMMENT ON COLUMN generated_tokens.metadata_minimized IS 'Minimal JSON metadata; do not store sensitive fields.';
