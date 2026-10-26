-- Run ONLY after applying review-only RLS migration to the isolated container.
-- Proves draft reservation works for >1 and historical published post unchanged.
SET ROLE cuisine_n8n;
DO $smoke$
BEGIN
  IF (SELECT count(*) FROM cuisine_social.validation_dispatches) <> 1 THEN
    RAISE EXCEPTION 'Historical dispatch no longer visible';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM cuisine_social.validation_dispatches
     WHERE post_id=1 AND state='reserved'
       AND idempotency_key='cuisine-social-validation/draft-1'
       AND resend_message_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Historical reservation mutated';
  END IF;
END;
$smoke$;
INSERT INTO cuisine_social.validation_dispatches(post_id,idempotency_key)
 SELECT id, 'cuisine-social-validation/draft-' || id::text
   FROM cuisine_social.posts WHERE source_id='recette:new-01';
DO $smoke$
DECLARE first_draft BIGINT;
        second_draft BIGINT;
        reviewed_post BIGINT;
BEGIN
  SELECT id INTO STRICT first_draft FROM cuisine_social.posts
    WHERE source_id='recette:new-01';
  SELECT id INTO STRICT second_draft FROM cuisine_social.posts
    WHERE source_id='recette:new-02';
  SELECT id INTO STRICT reviewed_post FROM cuisine_social.posts
    WHERE source_id='recette:b';
  IF first_draft <= 1 OR second_draft <= 1 OR first_draft = second_draft THEN
    RAISE EXCEPTION 'Expected distinct new draft IDs';
  END IF;
  -- Existing unique post_id and idempotency_key forbid a second reservation.
  BEGIN
    INSERT INTO cuisine_social.validation_dispatches(post_id,idempotency_key)
      VALUES(first_draft,'cuisine-social-validation/draft-' || first_draft::text);
    RAISE EXCEPTION 'Duplicate reservation unexpectedly succeeded';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO cuisine_social.validation_dispatches(post_id,idempotency_key)
      VALUES(second_draft,'WRONG-' || second_draft::text);
    RAISE EXCEPTION 'Wrong idempotency key unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO cuisine_social.validation_dispatches(post_id,idempotency_key,state)
      VALUES(second_draft,'cuisine-social-validation/draft-' || second_draft::text,'accepted');
    RAISE EXCEPTION 'Pre-accepted reservation unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO cuisine_social.validation_dispatches
      (post_id,idempotency_key,resend_message_id)
      VALUES(second_draft,'cuisine-social-validation/draft-' || second_draft::text,'fake');
    RAISE EXCEPTION 'Pre-sent reservation unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO cuisine_social.validation_dispatches(post_id,idempotency_key)
      VALUES(reviewed_post,'cuisine-social-validation/draft-' || reviewed_post::text);
    RAISE EXCEPTION 'Reservation for reviewed post unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    UPDATE cuisine_social.validation_dispatches
       SET state='accepted' WHERE post_id=first_draft;
    RAISE EXCEPTION 'Writer role unexpectedly updated dispatch state';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  IF (SELECT count(*) FROM cuisine_social.validation_dispatches) <> 2 THEN
    RAISE EXCEPTION 'Expected exactly two dispatch reservations';
  END IF;
  RAISE NOTICE 'SOCIAL_MULTI_DRAFT_DISPATCH_RLS_PASS';
END;
$smoke$;
RESET ROLE;
-- The private dashboard reader role must NEVER access reservation metadata.
SET ROLE cuisine_social_viewer;
DO $viewer$
BEGIN
  BEGIN
    PERFORM count(*) FROM cuisine_social.validation_dispatches;
    RAISE EXCEPTION 'Viewer unexpectedly accessed dispatches';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$viewer$;
RESET ROLE;
