-- Manual order for the item library. Run once in Supabase → SQL Editor.
-- Existing items keep their current order (newest first).

alter table public.items add column if not exists sort_order integer not null default 0;

update public.items i
set sort_order = r.rn
from (select id, row_number() over (order by created_at desc) as rn from public.items) r
where i.id = r.id;

drop index if exists public.items_created_idx;
create index if not exists items_library_idx on public.items (sort_order asc, created_at desc);
