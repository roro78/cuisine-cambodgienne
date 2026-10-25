-- Disposable PostgreSQL 17 smoke: schema.sql must own the actual dispatch DDL.
-- NEVER point this at Supabase. Postgres-only consistency assertions.
DO $verify$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='cuisine_social' AND c.relname='validation_dispatches'
      AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'Missing RLS-protected validation_dispatches table';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='cuisine_social.validation_dispatches'::regclass
      AND contype='f' AND pg_get_constraintdef(oid) LIKE '%ON DELETE RESTRICT%'
  ) THEN
    RAISE EXCEPTION 'Dispatches must prevent deletion of post history';
  END IF;
END
$verify$;
