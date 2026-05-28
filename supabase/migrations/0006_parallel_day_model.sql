-- 0006: parallel "day plan" model.
-- Additive — coexists with the existing meal_plans / dishes schema.
-- Run in the Supabase SQL Editor.

-- Fresh catalog for the parallel model.
create table foods (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  name_hi         text not null default '',
  category        text not null default '',
  ingredients     text not null default '',
  ingredients_hi  text not null default '',
  recipe_url      text,
  weight          smallint not null default 5 check (weight between 1 and 10),
  notes           text not null default '',
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_foods_active on foods(active);

-- User-configured default slots — every new day is seeded from these.
create table slot_templates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text not null default '#e5e7eb',
  position    int  not null,
  created_at  timestamptz not null default now()
);

-- A day. id = year*1000 + day_of_year  (2026-01-01 -> 2026001).
create table day_plans (
  id          bigint primary key,
  plan_date   date not null unique,
  created_at  timestamptz not null default now()
);

-- A meal slot within a day. id = day_plan_id concatenated with slot_no
-- (slot 1 of day 2026001 -> 20260011). slot_no is stable; position is the
-- mutable display order.
create table day_slots (
  id           bigint primary key,
  day_plan_id  bigint not null references day_plans(id) on delete cascade,
  slot_no      int  not null,
  name         text not null,
  color        text not null default '#e5e7eb',
  position     int  not null,
  created_at   timestamptz not null default now(),
  unique (day_plan_id, slot_no)
);
create index idx_day_slots_plan on day_slots(day_plan_id);

-- Foods placed in a slot.
create table day_slot_foods (
  day_slot_id  bigint not null references day_slots(id) on delete cascade,
  food_id      uuid   not null references foods(id) on delete restrict,
  position     int    not null default 0,
  primary key (day_slot_id, food_id)
);

create trigger trg_foods_updated_at
  before update on foods
  for each row execute function set_updated_at();

-- Row-level security — family-only, same as the rest of the app.
alter table foods           enable row level security;
alter table slot_templates  enable row level security;
alter table day_plans       enable row level security;
alter table day_slots       enable row level security;
alter table day_slot_foods  enable row level security;

create policy "family_all" on foods          for all to authenticated using (is_family_member()) with check (is_family_member());
create policy "family_all" on slot_templates for all to authenticated using (is_family_member()) with check (is_family_member());
create policy "family_all" on day_plans      for all to authenticated using (is_family_member()) with check (is_family_member());
create policy "family_all" on day_slots      for all to authenticated using (is_family_member()) with check (is_family_member());
create policy "family_all" on day_slot_foods for all to authenticated using (is_family_member()) with check (is_family_member());

-- Default slot template.
insert into slot_templates (name, color, position) values
  ('Breakfast', '#fef3c7', 1),
  ('Lunch',     '#e0f2fe', 2),
  ('Dinner',    '#e0e7ff', 3);
