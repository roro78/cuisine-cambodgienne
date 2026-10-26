-- REVIEW ONLY. DO NOT RUN ON SUPABASE LIVE UNTIL WORKFLOW 01 USES A
-- TRANSACTIONAL RESERVATION GATE AND THE KROEUNG INCIDENT IS RECONCILED.
-- Controlled migration from the 21-Oct-2026 single-post reservation policies.
-- Expected database: Cuisine du Cambodge PostgreSQL 17 (NEVER n8n metadata).
-- This is a ONE-TIME migration, deliberately NOT silently idempotent.
BEGIN;
DO $guard$
DECLARE
  r record;
BEGIN
  SELECT * INTO r FROM pg_roles WHERE rolname = 'cuisine_n8n';
  IF NOT FOUND OR NOT r.rolcanlogin OR r.rolinherit OR r.rolsuper OR
     r.rolbypassrls OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR
     EXISTS(SELECT 1 FROM pg_auth_members m
             WHERE m.member=r.oid OR m.roleid=r.oid) THEN
    RAISE EXCEPTION 'Unsafe or missing cuisine_n8n role: abort dispatch migration';
  END IF;
  IF NOT (
    SELECT c.relrowsecurity
      FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid
     WHERE n.nspname='cuisine_social' AND c.relname='validation_dispatches'
  ) OR NOT (
    SELECT c.relrowsecurity
      FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid
     WHERE n.nspname='cuisine_social' AND c.relname='posts'
  ) THEN
    RAISE EXCEPTION 'Both Cuisine tables must have RLS enabled';
  END IF;
  IF NOT has_table_privilege('cuisine_n8n','cuisine_social.posts','SELECT') OR
     NOT has_table_privilege('cuisine_n8n','cuisine_social.validation_dispatches','SELECT') OR
     NOT has_table_privilege('cuisine_n8n','cuisine_social.validation_dispatches','INSERT') OR
     has_table_privilege('cuisine_n8n','cuisine_social.validation_dispatches','UPDATE') OR
     has_table_privilege('cuisine_n8n','cuisine_social.validation_dispatches','DELETE') THEN
    RAISE EXCEPTION 'Missing/mismatched n8n dispatch grants';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname='cuisine_social' AND tablename='posts'
       AND policyname='cuisine_n8n_select' AND cmd='SELECT' AND qual='true'
       AND roles=ARRAY['cuisine_n8n']::name[]
  ) THEN RAISE EXCEPTION 'Expected source SELECT policy absent'; END IF;
  IF (SELECT count(*) FROM pg_policies
      WHERE schemaname='cuisine_social' AND tablename='validation_dispatches') <> 2 THEN
    RAISE EXCEPTION 'Unexpected dispatch policies: manual review required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname='cuisine_social' AND tablename='validation_dispatches'
       AND policyname='cuisine_n8n_read_draft_1_validation_dispatch'
       AND cmd='SELECT' AND qual='(post_id = 1)' AND with_check IS NULL
       AND roles=ARRAY['cuisine_n8n']::name[]
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname='cuisine_social' AND tablename='validation_dispatches'
       AND policyname='cuisine_n8n_reserve_draft_1_validation_dispatch'
       AND cmd='INSERT' AND qual IS NULL
       AND with_check='((post_id = 1) AND (idempotency_key = ''cuisine-social-validation/draft-1''::text) AND (state = ''reserved''::text) AND (resend_message_id IS NULL))'
       AND roles=ARRAY['cuisine_n8n']::name[]
  ) THEN
    RAISE EXCEPTION 'Historical dispatch policies drifted: stop';
  END IF;
END;
$guard$;

-- RLS scoped ONLY to the dedicated n8n backend role. Nothing for public roles.
DROP POLICY cuisine_n8n_read_draft_1_validation_dispatch
  ON cuisine_social.validation_dispatches;
DROP POLICY cuisine_n8n_reserve_draft_1_validation_dispatch
  ON cuisine_social.validation_dispatches;

CREATE POLICY cuisine_n8n_dispatch_history_select
  ON cuisine_social.validation_dispatches FOR SELECT TO cuisine_n8n
  USING (EXISTS (
    SELECT 1 FROM cuisine_social.posts p WHERE p.id = post_id
  ));

CREATE POLICY cuisine_n8n_dispatch_reserve_draft
  ON cuisine_social.validation_dispatches FOR INSERT TO cuisine_n8n
  WITH CHECK (
    post_id > 0
    AND idempotency_key = ('cuisine-social-validation/draft-' || post_id::text)
    AND state = 'reserved'
    AND resend_message_id IS NULL
    AND EXISTS (
      SELECT 1 FROM cuisine_social.posts p
       WHERE p.id = post_id AND p.status = 'draft'
         AND p.human_decision IS NULL AND p.decided_at IS NULL
         AND p.approved_at IS NULL
         AND p.fb_state = 'pending' AND p.ig_state = 'pending'
         AND p.facebook_post_id IS NULL AND p.instagram_post_id IS NULL
         AND p.instagram_container_id IS NULL
    )
  );
DO $verify$
BEGIN
  IF (SELECT count(*) FROM pg_policies
      WHERE schemaname='cuisine_social' AND tablename='validation_dispatches') <> 2 OR
     NOT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname='cuisine_social' AND tablename='validation_dispatches'
         AND policyname='cuisine_n8n_dispatch_reserve_draft' AND cmd='INSERT'
         AND roles=ARRAY['cuisine_n8n']::name[]
     ) THEN
    RAISE EXCEPTION 'Dispatch policy verification failed';
  END IF;
END;
$verify$;
COMMIT;

-- Important: this migration DOES NOT supply exactly-once email delivery.
-- Workflow 01 today calls POST /emails without a dispatch reservation node,
-- and Resend Idempotency-Key alone has a 24-hour lifetime.
-- Required follow-up: one atomic reservation before HTTP POST, block if no
-- reservation returned, and never automatically resend an 'uncertain' attempt.
-- Do NOT rollback automatically: historical post1 reserved record must remain.
