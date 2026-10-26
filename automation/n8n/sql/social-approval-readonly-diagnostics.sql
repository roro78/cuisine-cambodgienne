-- Cuisine du Cambodge — diagnostic social READ-ONLY / octobre 2026.
-- N'exécuter que dans le projet Cuisine du Cambodge.
-- Aucune réparation, UPDATE, INSERT, DELETE ou appel Meta.
-- 1) Statuts des posts; valeurs d'identifiants jamais affichées.
SELECT p.status,p.human_decision,p.fb_state,p.ig_state,
       COUNT(*)::int AS posts,
       BOOL_OR(p.facebook_post_id IS NOT NULL) AS has_facebook_refs,
       BOOL_OR(p.instagram_post_id IS NOT NULL) AS has_instagram_refs
FROM cuisine_social.posts p
GROUP BY p.status,p.human_decision,p.fb_state,p.ig_state
ORDER BY posts DESC;
-- 2) Contradictions entre les réservations d'e-mails et l'état du contenu.
SELECT d.state AS email_dispatch_state,p.status AS post_status,
       COUNT(*)::int AS total,
       MIN(d.created_at)::date AS oldest_date,
       MAX(d.created_at)::date AS newest_date
FROM cuisine_social.validation_dispatches d
JOIN cuisine_social.posts p ON p.id=d.post_id
GROUP BY d.state,p.status
ORDER BY total DESC;
-- 3) Les brouillons réellement en attente du dashboard.
SELECT status,COUNT(*)::int AS total
FROM cuisine_social.posts
WHERE status IN ('draft','revision_requested','manual_review')
GROUP BY status;
