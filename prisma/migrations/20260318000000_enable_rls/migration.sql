-- Enable Row Level Security on all public tables
-- The app connects as the 'postgres' superuser (bypasses RLS),
-- so this only blocks direct PostgREST/anon access.

ALTER TABLE "public"."Job" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Question" ENABLE ROW LEVEL SECURITY;
