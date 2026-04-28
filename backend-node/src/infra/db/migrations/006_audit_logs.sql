-- 006_audit_logs.sql
-- Generic audit log. Privacy-aware: only redacted payloads are stored.
-- IMPORTANT: this table has NO `expires_at`. Retention is an external policy
-- (a scheduled `DELETE ... WHERE created_at < now() - interval '...'`),
-- expressed outside the schema so it can be reviewed and audited.

CREATE TABLE audit_logs (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  scope             text        NOT NULL,
  action            text        NOT NULL,
  redacted_payload  jsonb       NOT NULL DEFAULT '{}'::jsonb,
  request_id        text,
  actor_id          text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_scope_action_idx ON audit_logs (scope, action);
CREATE INDEX audit_logs_created_at_idx   ON audit_logs (created_at);
CREATE INDEX audit_logs_request_id_idx   ON audit_logs (request_id) WHERE request_id IS NOT NULL;

COMMENT ON TABLE  audit_logs IS 'Append-only audit log. Retention is policy-driven (no in-table TTL).';
COMMENT ON COLUMN audit_logs.redacted_payload IS 'Caller MUST redact PII / secrets before insert.';
