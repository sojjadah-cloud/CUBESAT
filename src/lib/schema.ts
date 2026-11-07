// PostgreSQL schema, applied idempotently on every start.
// Kept in a module (not a .sql file) so serverless bundles always include it.
export const SCHEMA_SQL = `
-- MTC CubeSat recruitment platform schema (PostgreSQL).
-- Idempotent: executed on every server start.

CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'reviewer')),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  user_id    UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  ip         TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS drafts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  data       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference             TEXT NOT NULL UNIQUE,
  submission_key        TEXT NOT NULL UNIQUE,
  status                TEXT NOT NULL DEFAULT 'new'
                        CHECK (status IN ('new', 'under_review', 'shortlisted', 'accepted', 'not_selected')),
  category              TEXT NOT NULL CHECK (category IN ('technical', 'non_technical')),
  primary_team          TEXT NOT NULL,
  secondary_team        TEXT,
  full_name             TEXT NOT NULL,
  student_id            TEXT NOT NULL,
  student_id_norm       TEXT NOT NULL UNIQUE,
  academic_level        TEXT NOT NULL,
  department            TEXT NOT NULL,
  department_other      TEXT,
  specialisation        TEXT NOT NULL,
  specialisation_other  TEXT,
  phone                 TEXT NOT NULL,
  email                 TEXT,
  experience            JSONB NOT NULL,
  skills                JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills_other          TEXT,
  motivation_why        TEXT NOT NULL,
  motivation_contribute TEXT NOT NULL,
  motivation_learn      TEXT,
  weekly_hours          TEXT NOT NULL,
  locale                TEXT NOT NULL,
  consent_at            TIMESTAMPTZ NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Email is no longer collected (the student ID identifies applicants).
ALTER TABLE applications ALTER COLUMN email DROP NOT NULL;
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications (status);
CREATE INDEX IF NOT EXISTS applications_primary_team_idx ON applications (primary_team);
CREATE INDEX IF NOT EXISTS applications_created_idx ON applications (created_at DESC);

CREATE TABLE IF NOT EXISTS files (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  draft_id       UUID REFERENCES drafts(id) ON DELETE SET NULL,
  kind           TEXT NOT NULL CHECK (kind IN ('image', 'cv')),
  original_name  TEXT NOT NULL,
  mime           TEXT NOT NULL,
  size_bytes     INTEGER NOT NULL,
  storage_key    TEXT NOT NULL UNIQUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS files_application_idx ON files (application_id);
CREATE INDEX IF NOT EXISTS files_draft_idx ON files (draft_id);

CREATE TABLE IF NOT EXISTS application_notes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  author_id      UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  author_name    TEXT,
  body           TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  actor_id    UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  meta        JSONB,
  ip          TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs (created_at DESC);
`;
