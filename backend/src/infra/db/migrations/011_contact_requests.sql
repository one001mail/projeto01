-- 011_contact_requests.sql
-- Support inquiries submitted from the public site. No authentication is
-- required. `subject` is optional; `message` carries the body.
-- Neutral, non-financial data.

CREATE TABLE contact_requests (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  email      citext      NOT NULL,
  subject    text        CHECK (subject IS NULL OR char_length(subject) <= 200),
  message    text        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 5000),
  status     text        NOT NULL DEFAULT 'received'
                         CHECK (status IN ('received', 'processed', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX contact_requests_created_at_idx ON contact_requests (created_at DESC);
CREATE INDEX contact_requests_status_idx     ON contact_requests (status);
CREATE INDEX contact_requests_email_idx      ON contact_requests (email);

COMMENT ON TABLE  contact_requests IS 'Public support inquiries (name / email / message).';
COMMENT ON COLUMN contact_requests.status IS 'Lifecycle: received -> processed -> archived.';
