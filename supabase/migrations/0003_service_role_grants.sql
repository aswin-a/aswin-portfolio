-- Fix (2026-11-26): production inserts into runs and ai_crawls failed with
-- "permission denied for table runs". RLS is bypassed by service_role, but the role still needs
-- table privileges, and Supabase no longer grants them automatically to tables created in SQL.
-- Insert only: the server never reads these tables back. anon and authenticated get nothing.
grant insert on table public.runs, public.ai_crawls to service_role;
grant usage on sequence public.ai_crawls_id_seq to service_role;  -- ai_crawls.id is bigserial
