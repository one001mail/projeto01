-- 005_scheduler_jobs.sql
-- Generic background-job table. The application enqueues rows here; a worker
-- (added in B3) polls and updates the row through its lifecycle.

CREATE TABLE scheduler_jobs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type    text        NOT NULL,
  status      text        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  payload     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  run_at      timestamptz NOT NULL DEFAULT now(),
  attempts    integer     NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- The worker selects pending jobs whose run_at has elapsed, in FIFO order.
CREATE INDEX scheduler_jobs_pending_run_at_idx
  ON scheduler_jobs (run_at)
  WHERE status = 'pending';
CREATE INDEX scheduler_jobs_status_idx ON scheduler_jobs (status);
CREATE INDEX scheduler_jobs_job_type_idx ON scheduler_jobs (job_type);

CREATE TRIGGER scheduler_jobs_set_updated_at
  BEFORE UPDATE ON scheduler_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE scheduler_jobs IS 'Background-job queue persisted in Postgres.';
