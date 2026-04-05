BEGIN;

CREATE TABLE IF NOT EXISTS schema_migration_guard (
  id BIGSERIAL PRIMARY KEY,
  migration_name TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migration_guard (migration_name)
VALUES ('V001__reliability_baseline.sql')
ON CONFLICT DO NOTHING;

COMMIT;
