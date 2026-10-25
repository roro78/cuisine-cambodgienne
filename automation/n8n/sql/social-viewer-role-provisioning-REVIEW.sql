-- Cuisine du Cambodge — SCRIPT DE PROVISIONNEMENT (À REVOIR, NE PAS APPLIQUER AUTOMATIQUEMENT).
-- Source: dashboard privé /gestion-social/index.php.
-- Le rôle ne dispose pas de mot de passe : l'administrateur doit lui en fixer
-- un via un mécanisme privé avant toute utilisation. Ne jamais committer un secret.
-- Ne PAS lancer ce script sur la base n8n metadata ou les autres projets Supabase.
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='cuisine_social_viewer') THEN
    CREATE ROLE cuisine_social_viewer LOGIN NOINHERIT;
  END IF;
END $$;
-- Minimum requis : USAGE du schéma, SELECT des posts uniquement.
GRANT USAGE ON SCHEMA cuisine_social TO cuisine_social_viewer;
GRANT SELECT ON TABLE cuisine_social.posts TO cuisine_social_viewer;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE cuisine_social.posts FROM cuisine_social_viewer;
-- RLS est actif sur les posts de production ; un GRANT SELECT seul
-- n'est pas suffisant. Policy spécifique à ce rôle serveur (pas anon).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'cuisine_social' AND tablename = 'posts'
      AND policyname = 'cuisine_social_viewer_read_posts'
  ) THEN
    CREATE POLICY cuisine_social_viewer_read_posts
      ON cuisine_social.posts FOR SELECT
      TO cuisine_social_viewer USING (true);
  END IF;
END $$;
COMMIT;
-- IMPORTANT : confier la définition du mot de passe LOGIN à l'administrateur,
-- dans son outil privé. Conserver RLS ; ne jamais accorder ce rôle au navigateur,
-- à anon/authenticated, ou à cuisine_n8n.
-- Vérifier avec l'identité du rôle cuisine_social_viewer :
-- SELECT current_user, COUNT(*) FROM cuisine_social.posts;
-- SELECT has_table_privilege(current_user,'cuisine_social.posts','SELECT') AS can_read,
--        has_table_privilege(current_user,'cuisine_social.posts','UPDATE') AS can_write;
