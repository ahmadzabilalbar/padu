-- Let the admin hide a category (and, for a main category, its sub-categories) from visitors.
-- Run once in Supabase → SQL Editor.

alter table public.categories add column if not exists is_hidden boolean not null default false;
