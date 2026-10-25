-- REVIEW ONLY. Do not apply to Supabase without approval and full rollback plan.
-- PostgreSQL 17; only Cuisine schema. Existing social rows remain unchanged.
BEGIN;
CREATE FUNCTION cuisine_social.guard_post_approval_content()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog
AS $fn$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'draft' OR NEW.human_decision IS NOT NULL OR
       NEW.decided_at IS NOT NULL OR NEW.approved_at IS NOT NULL OR
       NEW.fb_state <> 'pending' OR NEW.ig_state <> 'pending' THEN
      RAISE EXCEPTION 'A new social post must be a draft' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
  END IF;

  IF (OLD.status <> 'draft' OR NEW.status <> 'draft' OR
      OLD.human_decision IS NOT NULL OR NEW.human_decision IS NOT NULL) AND (
      NEW.source_id IS DISTINCT FROM OLD.source_id OR
      NEW.source_fingerprint IS DISTINCT FROM OLD.source_fingerprint OR
      NEW.source_snapshot IS DISTINCT FROM OLD.source_snapshot OR
      NEW.scheduled_date IS DISTINCT FROM OLD.scheduled_date OR
      NEW.facebook_caption IS DISTINCT FROM OLD.facebook_caption OR
      NEW.instagram_caption IS DISTINCT FROM OLD.instagram_caption OR
      NEW.image_url IS DISTINCT FROM OLD.image_url
  ) THEN
    RAISE EXCEPTION 'Social source and media immutable during/after decision'
      USING ERRCODE = '23514';
  END IF;

  IF OLD.human_decision IS NOT NULL AND (
      NEW.human_decision IS DISTINCT FROM OLD.human_decision OR
      NEW.human_note IS DISTINCT FROM OLD.human_note OR
      NEW.decided_at IS DISTINCT FROM OLD.decided_at OR
      NEW.approved_at IS DISTINCT FROM OLD.approved_at
  ) THEN
    RAISE EXCEPTION 'Human decision immutable' USING ERRCODE = '23514';
  END IF;
  IF NEW.status IN ('approved','publishing','published') AND (
       NEW.human_decision IS DISTINCT FROM 'approved' OR
       NEW.approved_at IS NULL OR NEW.decided_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Publishable post requires human approval' USING ERRCODE = '23514';
  END IF;
  IF NEW.status = 'revision_requested' AND (
       NEW.human_decision IS DISTINCT FROM 'revision_requested' OR
       NEW.decided_at IS NULL OR NULLIF(btrim(NEW.human_note),'') IS NULL
  ) THEN
    RAISE EXCEPTION 'Revision requires a comment' USING ERRCODE = '23514';
  END IF;
  IF NEW.status = 'rejected' AND (
       NEW.human_decision IS DISTINCT FROM 'rejected' OR NEW.decided_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Rejection requires human decision' USING ERRCODE = '23514';
  END IF;
  IF (OLD.status = 'approved' AND NEW.status NOT IN ('approved','publishing','manual_review'))
    OR (OLD.status = 'publishing' AND NEW.status NOT IN ('publishing','published','manual_review'))
    OR (OLD.status = 'published' AND NEW.status NOT IN ('published','manual_review'))
    OR (OLD.status = 'manual_review' AND NEW.status NOT IN ('manual_review','published'))
    OR (OLD.status IN ('rejected','revision_requested') AND NEW.status <> OLD.status)
  THEN
    RAISE EXCEPTION 'Publication state regression not allowed' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION cuisine_social.guard_post_approval_content() FROM PUBLIC;
CREATE TRIGGER cuisine_social_approved_content_immutable
  BEFORE INSERT OR UPDATE ON cuisine_social.posts
  FOR EACH ROW EXECUTE FUNCTION cuisine_social.guard_post_approval_content();
COMMIT;
-- Optional rollback after verified backup and explicit operator decision:
-- DROP TRIGGER cuisine_social_approved_content_immutable ON cuisine_social.posts;
-- DROP FUNCTION cuisine_social.guard_post_approval_content();
