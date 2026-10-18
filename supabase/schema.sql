-- Padu board schema. Run once in Supabase → SQL Editor.
-- All writes go through the Next.js server (secret key), so the public
-- (anon) role only gets read access. The admin decides what sits on top.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  slug        text not null unique check (slug ~ '^[a-z0-9-]{1,80}$'),
  description text check (char_length(description) <= 200),
  is_pinned   boolean not null default false,
  pin_order   integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 120),
  body        text check (char_length(body) <= 1000),
  url         text check (char_length(url) <= 500),
  author      text check (char_length(author) <= 40),
  is_pinned   boolean not null default false,
  pin_order   integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Indexes match the exact board ordering: pinned first, then pin order, then newest.
create index if not exists categories_board_idx
  on public.categories (is_pinned desc, pin_order asc, created_at desc);

create index if not exists items_board_idx
  on public.items (category_id, is_pinned desc, pin_order asc, created_at desc);

-- Row Level Security: anyone can read; nobody can write with the public key.
alter table public.categories enable row level security;
alter table public.items enable row level security;

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories" on public.categories for select using (true);

drop policy if exists "Public read items" on public.items;
create policy "Public read items" on public.items for select using (true);
