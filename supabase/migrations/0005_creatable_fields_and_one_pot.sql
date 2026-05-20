-- 0005: free-text dish category + one-pot-meal dishes
-- Run this in the Supabase SQL Editor (or `supabase db push`).

-- Task 2 — category becomes free text so new categories can be created
-- straight from the dish form. The `dish_category` enum type is left in
-- place but is no longer referenced by any column.
alter table dishes
  alter column category type text using category::text;

-- Task 6 — a dish can be flagged as a "one-pot meal". When set, the app
-- keeps a matching row in `meals` (linked via source_dish_id) so the dish
-- is plannable on its own.
alter table dishes
  add column if not exists is_one_pot boolean not null default false;

alter table meals
  add column if not exists source_dish_id uuid references dishes(id) on delete cascade;

-- One auto-generated meal per dish (NULLs are allowed multiple times).
create unique index if not exists idx_meals_source_dish on meals(source_dish_id);
