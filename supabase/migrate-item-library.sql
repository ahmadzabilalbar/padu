-- One-time migration: items move from "one category each" to a shared library,
-- and categories can have sub-categories.
-- Run once in Supabase → SQL Editor on a project created with the old schema.
-- Safe to re-run: every step checks whether it has already happened.

begin;

alter table public.categories add column if not exists parent_id uuid
  references public.categories (id) on delete cascade check (parent_id <> id);
drop index if exists public.categories_board_idx;
create index categories_board_idx
  on public.categories (parent_id, is_pinned desc, pin_order asc, created_at desc);

alter table public.items add column if not exists image_path text check (char_length(image_path) <= 200);
alter table public.items add column if not exists location text check (char_length(location) <= 300);

create table if not exists public.category_items (
  category_id uuid not null references public.categories (id) on delete cascade,
  item_id     uuid not null references public.items (id) on delete cascade,
  is_pinned   boolean not null default false,
  pin_order   integer not null default 0,
  created_at  timestamptz not null default now(),
  primary key (category_id, item_id)
);

-- Copy each item's old placement (category, pin, date added), then drop the old columns.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'items' and column_name = 'category_id') then
    insert into public.category_items (category_id, item_id, is_pinned, pin_order, created_at)
    select category_id, id, is_pinned, pin_order, created_at from public.items
    on conflict do nothing;

    drop index if exists public.items_board_idx;
    alter table public.items drop column category_id, drop column is_pinned, drop column pin_order;
  end if;
end $$;

create index if not exists category_items_board_idx
  on public.category_items (category_id, is_pinned desc, pin_order asc, created_at desc);
create index if not exists category_items_item_idx on public.category_items (item_id);
create index if not exists items_created_idx on public.items (created_at desc);

alter table public.category_items enable row level security;
drop policy if exists "Public read category items" on public.category_items;
create policy "Public read category items" on public.category_items for select using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-images', 'item-images', true, 5242880, array['image/webp', 'image/jpeg', 'image/png', 'image/gif'])
on conflict (id) do nothing;

commit;
