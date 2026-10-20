-- Padu board schema. Run once in Supabase → SQL Editor (new projects).
-- Existing projects created before the item library: run migrate-item-library.sql instead.
-- All writes go through the Next.js server (secret key), so the public
-- (anon) role only gets read access. The admin decides what sits on top.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  slug        text not null unique check (slug ~ '^[a-z0-9-]{1,80}$'),
  description text check (char_length(description) <= 200),
  -- Set for a sub-category (one level deep, e.g. Makan → Mi Goreng). Deleting a parent deletes its sub-categories.
  parent_id   uuid references public.categories (id) on delete cascade check (parent_id <> id),
  is_pinned   boolean not null default false,
  pin_order   integer not null default 0,
  created_at  timestamptz not null default now()
);

-- The item library. Each item is stored once and can sit in any number of categories.
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 120),
  body        text check (char_length(body) <= 1000),
  url         text check (char_length(url) <= 500),
  author      text check (char_length(author) <= 40),
  location    text check (char_length(location) <= 300),
  -- The admin's manual order for the library (lowest first).
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- An item placed in a category. Pinning and pin order are per category.
create table if not exists public.category_items (
  category_id uuid not null references public.categories (id) on delete cascade,
  item_id     uuid not null references public.items (id) on delete cascade,
  is_pinned   boolean not null default false,
  pin_order   integer not null default 0,
  created_at  timestamptz not null default now(),
  primary key (category_id, item_id)
);

-- Indexes match the exact board ordering: pinned first, then pin order, then newest.
-- Categories are ordered among their siblings (top level, or one parent's sub-categories).
create index if not exists categories_board_idx
  on public.categories (parent_id, is_pinned desc, pin_order asc, created_at desc);

create index if not exists category_items_board_idx
  on public.category_items (category_id, is_pinned desc, pin_order asc, created_at desc);

create index if not exists category_items_item_idx on public.category_items (item_id);

create index if not exists items_library_idx on public.items (sort_order asc, created_at desc);

-- Row Level Security: anyone can read; nobody can write with the public key.
alter table public.categories enable row level security;
alter table public.items enable row level security;
alter table public.category_items enable row level security;

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories" on public.categories for select using (true);

drop policy if exists "Public read items" on public.items;
create policy "Public read items" on public.items for select using (true);

drop policy if exists "Public read category items" on public.category_items;
create policy "Public read category items" on public.category_items for select using (true);
