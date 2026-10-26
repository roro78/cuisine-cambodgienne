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
 VALUES(3,'cuisine-social-validation/draft-3');
DO $smoke$
BEGIN
  -- Existing unique post_id and idempotency_key forbid a second reservation.
  BEGIN
    INSERT INTO cuisine_social.validation_dispatches(post_id,idempotency_key)
      VALUES(3,'cuisine-social-validation/draft-3');
    RAISE EXCEPTION 'Duplicate reservation unexpectedly succeeded';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO cuisine_social.validation_dispatches(post_id,idempotency_key)
      VALUES(4,'draft-4-WRONG');
    RAISE EXCEPTION 'Wrong idempotency key unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO cuisine_social.validation_dispatches(post_id,idempotency_key,state)
      VALUES(4,'cuisine-social-validation/draft-4','accepted');
    RAISE EXCEPTION 'Pre-accepted reservation unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO cuisine_social.validation_dispatches
      (post_id,idempotency_key,resend_message_id)
      VALUES(4,'cuisine-social-validation/draft-4','fake');
    RAISE EXCEPTION 'Pre-sent reservation unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO cuisine_social.validation_dispatches(post_id,idempotency_key)
      VALUES(1,'cuisine-social-validation/draft-1');
    RAISE EXCEPTION 'Reservation for published post unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    UPDATE cuisine_social.validation_dispatches
       SET state='accepted' WHERE post_id=3;
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
