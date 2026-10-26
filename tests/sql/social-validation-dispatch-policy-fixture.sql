-- PG17 ephemeral test fixture. Not a production data migration.
-- Simulates exactly the two narrow policies introspected on 26-Oct-2026.
CREATE ROLE cuisine_n8n LOGIN NOINHERIT;
GRANT USAGE ON SCHEMA cuisine_social TO cuisine_n8n;
GRANT SELECT ON cuisine_social.posts TO cuisine_n8n;
GRANT SELECT,INSERT ON cuisine_social.validation_dispatches TO cuisine_n8n;
CREATE POLICY cuisine_n8n_select ON cuisine_social.posts
 FOR SELECT TO cuisine_n8n USING (true);
CREATE POLICY cuisine_n8n_read_draft_1_validation_dispatch
 ON cuisine_social.validation_dispatches FOR SELECT TO cuisine_n8n
 USING (post_id = 1);
CREATE POLICY cuisine_n8n_reserve_draft_1_validation_dispatch
 ON cuisine_social.validation_dispatches FOR INSERT TO cuisine_n8n
 WITH CHECK (
   (post_id = 1)
   AND (idempotency_key = 'cuisine-social-validation/draft-1'::text)
   AND (state = 'reserved'::text)
   AND (resend_message_id IS NULL)
 );
INSERT INTO cuisine_social.validation_dispatches(post_id,idempotency_key,state)
 VALUES(1,'cuisine-social-validation/draft-1','reserved');
-- status=approved/published for post 1 from previous smoke test.
INSERT INTO cuisine_social.posts
  (source_id,source_fingerprint,source_snapshot,scheduled_date,
    facebook_caption,instagram_caption,image_url)
 VALUES
  ('recette:new-01','new01','{"title":"New Draft 1"}','2026-10-29','FB1','IG1','img1'),
  ('recette:new-02','new02','{"title":"New Draft 2"}','2026-10-30','FB2','IG2','img2');
SET ROLE cuisine_n8n;
DO $before$
DECLARE first_draft BIGINT;
BEGIN
  -- PostgreSQL identity sequences have gaps after rolled-back inserts.
  -- Never assume next post_id is 3: resolve exact BIGINT from source identity.
  SELECT id INTO STRICT first_draft FROM cuisine_social.posts
    WHERE source_id='recette:new-01';
  IF first_draft <= 1 THEN RAISE EXCEPTION 'Unexpected first draft id'; END IF;
  BEGIN
    INSERT INTO cuisine_social.validation_dispatches(post_id,idempotency_key)
      VALUES (first_draft, 'cuisine-social-validation/draft-' || first_draft::text);
    RAISE EXCEPTION 'Old draft-1 policy unexpectedly accepted a newer draft';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$before$;
RESET ROLE;
