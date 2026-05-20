-- Menu Planner initial schema
-- Run this in the Supabase SQL Editor (or via supabase CLI: `supabase db push`)

-- =========================================================================
-- ENUMS
-- =========================================================================
create type dish_category as enum ('Component', 'Beverage', 'Side', 'Salad', 'Dessert');
create type meal_type     as enum ('Breakfast', 'Lunch', 'Evening Snack', 'Dinner');
create type season_type   as enum ('Summer', 'Winter', 'All');

-- =========================================================================
-- CATALOG: dishes, meals, meal_dishes
-- =========================================================================
create table dishes (
  id           uuid primary key default gen_random_uuid(),
  name_en      text not null,
  name_hi      text not null,
  category     dish_category not null,
  ingredients  text not null default '',
  recipe_url   text,
  cuisine      text,
  tags         text not null default '',
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index idx_dishes_category_active on dishes(category) where active;
create index idx_dishes_name_en_lower    on dishes(lower(name_en));

create table meals (
  id            uuid primary key default gen_random_uuid(),
  name_en       text not null,
  name_hi       text not null,
  meal_type     meal_type not null,
  weight        smallint not null default 5 check (weight between 1 and 10),
  cuisine       text,
  tags          text not null default '',
  effort        smallint check (effort between 1 and 5),
  season        season_type not null default 'All',
  guest_worthy  boolean not null default false,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_meals_type_active on meals(meal_type) where active;

create table meal_dishes (
  meal_id   uuid not null references meals(id)  on delete cascade,
  dish_id   uuid not null references dishes(id) on delete restrict,
  position  smallint not null default 0,
  primary key (meal_id, dish_id)
);
create index idx_meal_dishes_dish on meal_dishes(dish_id);

-- =========================================================================
-- SCHEDULE: meal_plans, meal_plan_meals, meal_plan_addons
-- =========================================================================
create table meal_plans (
  id           uuid primary key default gen_random_uuid(),
  date         date not null,
  slot         meal_type not null,
  eating_out   boolean not null default false,
  guests       smallint not null default 0,
  today_note   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (date, slot)
);
create index idx_meal_plans_date on meal_plans(date);

create table meal_plan_meals (
  meal_plan_id  uuid not null references meal_plans(id) on delete cascade,
  meal_id       uuid not null references meals(id)      on delete restrict,
  position      smallint not null default 0,
  primary key (meal_plan_id, meal_id)
);
create index idx_meal_plan_meals_meal on meal_plan_meals(meal_id);

create table meal_plan_addons (
  meal_plan_id  uuid not null references meal_plans(id) on delete cascade,
  dish_id       uuid not null references dishes(id)     on delete restrict,
  primary key (meal_plan_id, dish_id)
);

-- =========================================================================
-- SYSTEM: family_users, cook_tokens, settings
-- =========================================================================
create table family_users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  display_name  text,
  created_at    timestamptz not null default now()
);

create table cook_tokens (
  token       text primary key,
  label       text,
  revoked     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Singleton settings row (id = 1 always)
create table settings (
  id                              smallint primary key default 1 check (id = 1),
  planning_horizon_days           smallint not null default 7,
  viewer_horizon_days             smallint not null default 3,
  deadline_time                   time     not null default '21:00:00',
  household_size                  smallint not null default 2,
  no_repeat_days_breakfast        smallint not null default 5,
  no_repeat_days_lunch            smallint not null default 7,
  no_repeat_days_evening_snack    smallint not null default 3,
  no_repeat_days_dinner           smallint not null default 7,
  updated_at                      timestamptz not null default now()
);
insert into settings (id) values (1);

-- =========================================================================
-- updated_at trigger helper
-- =========================================================================
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_dishes_updated_at      before update on dishes      for each row execute function set_updated_at();
create trigger trg_meals_updated_at       before update on meals       for each row execute function set_updated_at();
create trigger trg_meal_plans_updated_at  before update on meal_plans  for each row execute function set_updated_at();
create trigger trg_settings_updated_at    before update on settings    for each row execute function set_updated_at();

-- =========================================================================
-- ROW-LEVEL SECURITY
-- =========================================================================
-- Family members (anyone with a row in family_users) have full access.
-- Cook access is NOT through RLS — the /viewer/[token] route uses the
-- service-role key after validating the cook_tokens entry server-side.

alter table dishes              enable row level security;
alter table meals               enable row level security;
alter table meal_dishes         enable row level security;
alter table meal_plans          enable row level security;
alter table meal_plan_meals     enable row level security;
alter table meal_plan_addons    enable row level security;
alter table family_users        enable row level security;
alter table cook_tokens         enable row level security;
alter table settings            enable row level security;

create or replace function is_family_member() returns boolean as $$
  select exists (select 1 from family_users where id = auth.uid());
$$ language sql stable security definer;

create policy "family_all" on dishes              for all to authenticated using (is_family_member()) with check (is_family_member());
create policy "family_all" on meals               for all to authenticated using (is_family_member()) with check (is_family_member());
create policy "family_all" on meal_dishes         for all to authenticated using (is_family_member()) with check (is_family_member());
create policy "family_all" on meal_plans          for all to authenticated using (is_family_member()) with check (is_family_member());
create policy "family_all" on meal_plan_meals     for all to authenticated using (is_family_member()) with check (is_family_member());
create policy "family_all" on meal_plan_addons    for all to authenticated using (is_family_member()) with check (is_family_member());
create policy "family_all" on family_users        for all to authenticated using (is_family_member()) with check (is_family_member());
create policy "family_all" on cook_tokens         for all to authenticated using (is_family_member()) with check (is_family_member());
create policy "family_all" on settings            for all to authenticated using (is_family_member()) with check (is_family_member());

-- Allow a brand-new user to insert themselves into family_users on first login
-- (so the very first sign-in isn't blocked by is_family_member()=false).
-- You can tighten this later (e.g., restrict by email allowlist).
create policy "first_login_self_insert" on family_users
  for insert to authenticated
  with check (id = auth.uid());
