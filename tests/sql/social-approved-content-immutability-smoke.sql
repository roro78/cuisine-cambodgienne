-- Test only in disposable postgres:17-alpine (never use an external DB).
INSERT INTO cuisine_social.posts
 (source_id,source_fingerprint,source_snapshot,scheduled_date,facebook_caption,instagram_caption,image_url)
 VALUES ('recette:amok','f1','{"title":"Amok"}','2026-10-27','FB draft','IG draft',
 'https://www.cuisine-du-cambodge.com/social-assets/amok.jpg');
UPDATE cuisine_social.posts SET facebook_caption='FB reviewed' WHERE id=1;
DO $x$
BEGIN
 BEGIN
  UPDATE cuisine_social.posts SET status='approved',human_decision='approved',
   approved_at=NOW(),decided_at=NOW(),image_url='bad-url' WHERE id=1;
  RAISE EXCEPTION 'Simultaneous edit and approval was incorrectly allowed';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
END;
$x$;
UPDATE cuisine_social.posts SET status='approved',human_decision='approved',
 approved_at=NOW(),decided_at=NOW() WHERE id=1;
DO $x$
BEGIN
 BEGIN
  UPDATE cuisine_social.posts SET image_url='changed' WHERE id=1;
  RAISE EXCEPTION 'Approved photo could be changed';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 BEGIN
  UPDATE cuisine_social.posts SET facebook_caption='changed' WHERE id=1;
  RAISE EXCEPTION 'Approved caption could be changed';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 BEGIN
  UPDATE cuisine_social.posts SET source_snapshot='{}' WHERE id=1;
  RAISE EXCEPTION 'Approved source could be changed';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 BEGIN
  UPDATE cuisine_social.posts SET human_decision='rejected' WHERE id=1;
  RAISE EXCEPTION 'Approved decision could be changed';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
END;
$x$;
UPDATE cuisine_social.posts SET status='publishing',fb_state='submitting',
 ig_state='creating' WHERE id=1;
UPDATE cuisine_social.posts SET fb_state='published',facebook_post_id='fb-test' WHERE id=1;
UPDATE cuisine_social.posts SET ig_state='published',instagram_post_id='ig-test',
 status='published',published_at=NOW() WHERE id=1;
DO $x$
BEGIN
 BEGIN
  UPDATE cuisine_social.posts SET status='approved' WHERE id=1;
  RAISE EXCEPTION 'Published item could be requeued';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 BEGIN
  INSERT INTO cuisine_social.posts
  (source_id,source_fingerprint,source_snapshot,scheduled_date,facebook_caption,
   instagram_caption,image_url,status,human_decision,approved_at,decided_at)
  VALUES ('recette:b','f2','{}','2026-10-28','B','B','img','approved','approved',NOW(),NOW());
  RAISE EXCEPTION 'Preapproved insert was allowed';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
END;
$x$;
INSERT INTO cuisine_social.posts
 (source_id,source_fingerprint,source_snapshot,scheduled_date,facebook_caption,instagram_caption,image_url)
 VALUES ('recette:b','f2','{}','2026-10-28','B','B','img');
UPDATE cuisine_social.posts SET status='revision_requested',
 human_decision='revision_requested',human_note='Corriger',decided_at=NOW()
 WHERE source_id='recette:b';
DO $x$
BEGIN
 BEGIN
  UPDATE cuisine_social.posts SET status='draft' WHERE source_id='recette:b';
  RAISE EXCEPTION 'Rejected/revision draft recycled';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 IF (SELECT count(*) FROM cuisine_social.posts) <> 2
   THEN RAISE EXCEPTION 'Unexpected row count'; END IF;
 RAISE NOTICE 'SOCIAL_POST_APPROVAL_IMMUTABILITY_PASS';
END;
$x$;
