-- Read-only role smoke against an ephemeral PostgreSQL 17 database.
-- Must execute AFTER schema, fixture, and role provisioning.
DO $check$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM pg_roles WHERE rolname='cuisine_social_viewer';
  IF NOT FOUND OR NOT r.rolcanlogin OR r.rolinherit OR r.rolsuper OR
     r.rolbypassrls OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication THEN
    RAISE EXCEPTION 'Unsafe viewer role';
  END IF;
  IF EXISTS(SELECT 1 FROM pg_auth_members m WHERE m.member=r.oid OR m.roleid=r.oid) THEN
    RAISE EXCEPTION 'Viewer role has membership drift';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='cuisine_social'
    AND tablename='posts' AND policyname='cuisine_social_viewer_read_posts'
    AND cmd='SELECT' AND roles=ARRAY['cuisine_social_viewer']::name[]
    AND qual='true' AND with_check IS NULL
  ) THEN
    RAISE EXCEPTION 'Expected isolated RLS SELECT policy missing';
  END IF;
END;
$check$;
SET ROLE cuisine_social_viewer;
DO $check$
DECLARE rows_visible integer;
BEGIN
  IF current_user <> 'cuisine_social_viewer' OR
     NOT has_table_privilege(current_user,'cuisine_social.posts','SELECT') THEN
    RAISE EXCEPTION 'Role did not become the SELECT-only viewer';
  END IF;
  IF has_table_privilege(current_user,'cuisine_social.posts','INSERT') OR
     has_table_privilege(current_user,'cuisine_social.posts','UPDATE') OR
     has_table_privilege(current_user,'cuisine_social.posts','DELETE') OR
     has_table_privilege(current_user,'cuisine_social.posts','TRUNCATE') OR
     has_table_privilege(current_user,'cuisine_social.posts','REFERENCES') OR
     has_table_privilege(current_user,'cuisine_social.posts','TRIGGER') OR
     has_table_privilege(current_user,'cuisine_social.validation_dispatches','SELECT') OR
     has_table_privilege(current_user,'cuisine_social.validation_dispatches','INSERT') OR
     has_table_privilege(current_user,'cuisine_social.validation_dispatches','UPDATE') OR
     has_table_privilege(current_user,'cuisine_social.validation_dispatches','DELETE') THEN
    RAISE EXCEPTION 'Reader has unexpected data privileges';
  END IF;
  SELECT count(*) INTO rows_visible FROM cuisine_social.posts;
  IF rows_visible <> 2 THEN RAISE EXCEPTION 'Unexpected RLS result: %',rows_visible; END IF;
  BEGIN
    UPDATE cuisine_social.posts SET facebook_caption='UNAUTHORIZED' WHERE id=1;
    RAISE EXCEPTION 'Viewer was unexpectedly allowed to update';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RAISE NOTICE 'CUISINE_SOCIAL_VIEWER_ROLE_PASS (2 readable, 0 writable)';
END;
$check$;
RESET ROLE;
