-- Run against a Cuisine-only PostgreSQL database/user, NOT the n8n metadata database.
-- These statements create a schema isolating Cuisine editorial/social state.
CREATE SCHEMA IF NOT EXISTS cuisine_social;
CREATE TABLE IF NOT EXISTS cuisine_social.posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id TEXT NOT NULL,
  source_fingerprint TEXT NOT NULL,
  source_snapshot JSONB NOT NULL,
  scheduled_date DATE NOT NULL,
  facebook_caption TEXT NOT NULL,
  instagram_caption TEXT NOT NULL,
  image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','approved','revision_requested','rejected','publishing','published','manual_review')),
  fb_state TEXT NOT NULL DEFAULT 'pending'
    CHECK (fb_state IN ('pending','submitting','published','manual_review')),
  ig_state TEXT NOT NULL DEFAULT 'pending'
    CHECK (ig_state IN ('pending','creating','container_created','checking','submitting','published','manual_review')),
  facebook_post_id TEXT,
  instagram_container_id TEXT,
  instagram_post_id TEXT,
  approved_at TIMESTAMPTZ,
  human_decision TEXT CHECK (human_decision IN ('approved','revision_requested','rejected')),
  human_note TEXT,
  decided_at TIMESTAMPTZ,
  publishing_started_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (scheduled_date),
  UNIQUE (source_id,source_fingerprint,scheduled_date)
);
CREATE INDEX IF NOT EXISTS cuisine_social_posts_status_date_idx
  ON cuisine_social.posts (status, scheduled_date);
CREATE INDEX IF NOT EXISTS cuisine_social_posts_instagram_idx
  ON cuisine_social.posts (ig_state, updated_at);
-- A dead workflow leaves 'submitting' / 'creating' untouched by cron.
-- Reconcile platform state manually before changing them: safety over duplicate posts.
