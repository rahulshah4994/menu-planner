-- Grocery list: persistent table the family fills with quantities and ticks off.
-- The "Regenerate from planner" action upserts new ingredient names from the
-- upcoming meal plans; existing items keep their state.

create table grocery_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                         -- "Onion" (display)
  name_key    text not null unique,                  -- "onion"  (lower-cased, dedup)
  quantity    text,                                  -- freeform: "500g", "2 kg", "1 bunch"
  notes       text,
  ticked      boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_grocery_items_ticked on grocery_items(ticked);

create trigger trg_grocery_items_updated_at
  before update on grocery_items
  for each row execute function set_updated_at();

alter table grocery_items enable row level security;
create policy "family_all" on grocery_items
  for all to authenticated
  using (is_family_member())
  with check (is_family_member());
