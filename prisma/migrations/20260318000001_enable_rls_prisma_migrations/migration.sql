-- Enable RLS on Prisma's internal migration tracking table
-- and deny all access from anon/authenticated roles.
-- The postgres superuser (used by the app and Prisma CLI) still has full access.

ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny_all" ON public._prisma_migrations
  FOR ALL TO public USING (false);
