-- 007_outbox_events.sql
-- Transactional outbox. Producers write a row in the same transaction as
-- their domain change; a dispatcher (B3+) reads pending rows and publishes.

CREATE TABLE outbox_events (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name    text        NOT NULL,
  aggregate_id  uuid,
  payload       jsonb       NOT NULL,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'processed', 'failed')),
  attempts      integer     NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz
);

-- Dispatcher polls FIFO over pending events.
CREATE INDEX outbox_events_pending_created_at_idx
  ON outbox_events (created_at)
  WHERE status = 'pending';
CREATE INDEX outbox_events_status_idx        ON outbox_events (status);
CREATE INDEX outbox_events_event_name_idx    ON outbox_events (event_name);
CREATE INDEX outbox_events_aggregate_id_idx  ON outbox_events (aggregate_id) WHERE aggregate_id IS NOT NULL;

COMMENT ON TABLE outbox_events IS 'Transactional outbox; dispatcher (B3+) drains pending rows.';
