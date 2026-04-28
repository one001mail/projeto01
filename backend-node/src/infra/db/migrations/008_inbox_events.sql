-- 008_inbox_events.sql
-- Inbox de-duplication: each event handler claims a unique (event_id, handler_name)
-- row before processing. Subsequent attempts for the same pair become no-ops.

CREATE TABLE inbox_events (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid        NOT NULL,
  handler_name  text        NOT NULL,
  processed_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inbox_events_event_handler_uq UNIQUE (event_id, handler_name)
);

CREATE INDEX inbox_events_event_id_idx ON inbox_events (event_id);

COMMENT ON TABLE inbox_events IS 'Per-handler de-duplication ledger for at-least-once delivery.';
