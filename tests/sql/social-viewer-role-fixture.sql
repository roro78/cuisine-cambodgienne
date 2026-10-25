-- Disposable PostgreSQL 17 fixture. NEVER point this at Supabase or another project.
ALTER TABLE cuisine_social.posts ENABLE ROW LEVEL SECURITY;
CREATE TABLE cuisine_social.validation_dispatches (
  post_id BIGINT PRIMARY KEY REFERENCES cuisine_social.posts(id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL UNIQUE CHECK (char_length(idempotency_key) BETWEEN 1 AND 256),
  state TEXT NOT NULL CHECK (state IN ('reserved','accepted','uncertain')),
  resend_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE cuisine_social.validation_dispatches ENABLE ROW LEVEL SECURITY;
