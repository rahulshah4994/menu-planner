-- 0010: Family layer above users.
--
-- Before this migration the app had a single implicit family: `family_users`
-- was just an allow-list and every data table was global. This adds explicit
-- `families`, scopes every table by `family_id`, and migrates all existing data
-- into one default family so the current login keeps working unchanged.
--
-- Membership model: one family per user. New users either create a family or
-- join an existing one with its join code (see create_family / join_family).
--
-- Run in the Supabase SQL Editor (or `supabase db push`). Wrapped in a
-- transaction so a failed run rolls back cleanly and can be re-run as-is.

begin;

-- =========================================================================
-- FAMILIES + default family
-- =========================================================================
create table families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'My Family',
  join_code   text not null unique,
  created_at  timestamptz not null default now()
);

-- The default family that inherits all pre-existing data.
insert into families (id, name, join_code)
values (
  '00000000-0000-0000-0000-000000000001',
  'My Family',
  upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
);

-- =========================================================================
-- family_users: each user belongs to exactly one family
-- =========================================================================
alter table family_users
  add column family_id uuid references families(id) on delete cascade;
update family_users set family_id = '00000000-0000-0000-0000-000000000001';
alter table family_users alter column family_id set not null;
create index idx_family_users_family on family_users(family_id);

-- =========================================================================
-- Add family_id to every data table, backfill, lock to NOT NULL
-- =========================================================================
alter table foods           add column family_id uuid references families(id) on delete cascade;
alter table day_plans       add column family_id uuid references families(id) on delete cascade;
alter table day_slots       add column family_id uuid references families(id) on delete cascade;
alter table day_slot_foods  add column family_id uuid references families(id) on delete cascade;
alter table slot_templates  add column family_id uuid references families(id) on delete cascade;
alter table cook_tokens     add column family_id uuid references families(id) on delete cascade;

update foods          set family_id = '00000000-0000-0000-0000-000000000001';
update day_plans      set family_id = '00000000-0000-0000-0000-000000000001';
update day_slots      set family_id = '00000000-0000-0000-0000-000000000001';
update day_slot_foods set family_id = '00000000-0000-0000-0000-000000000001';
update slot_templates set family_id = '00000000-0000-0000-0000-000000000001';
update cook_tokens    set family_id = '00000000-0000-0000-0000-000000000001';

alter table foods          alter column family_id set not null;
alter table day_plans      alter column family_id set not null;
alter table day_slots      alter column family_id set not null;
alter table day_slot_foods alter column family_id set not null;
alter table slot_templates alter column family_id set not null;
alter table cook_tokens    alter column family_id set not null;

create index idx_foods_family          on foods(family_id);
create index idx_day_plans_family      on day_plans(family_id);
create index idx_day_slots_family      on day_slots(family_id);
create index idx_day_slot_foods_family on day_slot_foods(family_id);
create index idx_slot_templates_family on slot_templates(family_id);
create index idx_cook_tokens_family    on cook_tokens(family_id);

-- =========================================================================
-- Composite keys for the deterministic-ID tables.
-- day_plan / day_slot ids are derived purely from the date (src/lib/v2/ids.ts)
-- so they collide across families. Make them unique PER FAMILY.
-- =========================================================================
-- Drop the child FKs first — they depend on the parent PKs we're replacing.
alter table day_slot_foods drop constraint if exists day_slot_foods_day_slot_id_fkey;
alter table day_slots      drop constraint if exists day_slots_day_plan_id_fkey;

-- day_plans: PK (family_id, id), unique (family_id, plan_date)
alter table day_plans drop constraint if exists day_plans_pkey;
alter table day_plans drop constraint if exists day_plans_plan_date_key;
alter table day_plans add primary key (family_id, id);
alter table day_plans add constraint day_plans_family_date_key unique (family_id, plan_date);

-- day_slots: PK (family_id, id), FK -> day_plans(family_id, id),
--            unique (family_id, day_plan_id, slot_no)
alter table day_slots drop constraint if exists day_slots_pkey;
alter table day_slots drop constraint if exists day_slots_day_plan_id_slot_no_key;
alter table day_slots add primary key (family_id, id);
alter table day_slots add constraint day_slots_day_plan_fkey
  foreign key (family_id, day_plan_id) references day_plans(family_id, id) on delete cascade;
alter table day_slots add constraint day_slots_family_plan_slot_key
  unique (family_id, day_plan_id, slot_no);

-- day_slot_foods: PK (family_id, day_slot_id, food_id), FK -> day_slots(family_id, id)
alter table day_slot_foods drop constraint if exists day_slot_foods_pkey;
alter table day_slot_foods add primary key (family_id, day_slot_id, food_id);
alter table day_slot_foods add constraint day_slot_foods_day_slot_fkey
  foreign key (family_id, day_slot_id) references day_slots(family_id, id) on delete cascade;

-- =========================================================================
-- settings: singleton -> one row per family
-- =========================================================================
alter table settings
  add column family_id uuid references families(id) on delete cascade;
update settings set family_id = '00000000-0000-0000-0000-000000000001';
-- Dropping `id` removes both its PK and the `check (id = 1)` singleton guard.
alter table settings drop column id;
alter table settings alter column family_id set not null;
alter table settings add primary key (family_id);

-- =========================================================================
-- Helper + onboarding functions
-- =========================================================================
-- The caller's family. SECURITY DEFINER so it can read family_users under RLS.
create or replace function current_family_id() returns uuid as $$
  select family_id from family_users where id = auth.uid();
$$ language sql stable security definer;

-- Short, human-friendly, collision-checked join code.
create or replace function gen_join_code() returns text as $$
declare
  code text;
begin
  loop
    -- 6 chars from an unambiguous alphabet (no 0/O/1/I).
    select string_agg(
      substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
             (floor(random() * 32) + 1)::int, 1),
      ''
    )
    into code
    from generate_series(1, 6);
    exit when not exists (select 1 from families where join_code = code);
  end loop;
  return code;
end;
$$ language plpgsql volatile;

-- Create a new family with the caller as its first member.
create or replace function create_family(p_name text) returns text as $$
declare
  v_family_id uuid;
  v_code      text;
begin
  if exists (select 1 from family_users where id = auth.uid()) then
    raise exception 'You already belong to a family';
  end if;

  v_code := gen_join_code();
  insert into families (name, join_code)
  values (coalesce(nullif(trim(p_name), ''), 'My Family'), v_code)
  returning id into v_family_id;

  insert into family_users (id, email, family_id)
  values (auth.uid(), auth.email(), v_family_id);

  -- Seed per-family defaults.
  insert into settings (family_id) values (v_family_id);
  insert into slot_templates (family_id, name, color, position) values
    (v_family_id, 'Breakfast', '#fef3c7', 1),
    (v_family_id, 'Lunch',     '#e0f2fe', 2),
    (v_family_id, 'Dinner',    '#e0e7ff', 3);

  return v_code;
end;
$$ language plpgsql volatile security definer;

-- Join an existing family by its join code.
create or replace function join_family(p_code text) returns void as $$
declare
  v_family_id uuid;
begin
  if exists (select 1 from family_users where id = auth.uid()) then
    raise exception 'You already belong to a family';
  end if;

  select id into v_family_id
  from families where join_code = upper(trim(p_code));
  if v_family_id is null then
    raise exception 'No family found for that code';
  end if;

  insert into family_users (id, email, family_id)
  values (auth.uid(), auth.email(), v_family_id);
end;
$$ language plpgsql volatile security definer;

grant execute on function create_family(text) to authenticated;
grant execute on function join_family(text)   to authenticated;
grant execute on function current_family_id() to authenticated;

-- =========================================================================
-- BEFORE INSERT trigger: default family_id to the caller's family.
-- Lets existing INSERTs stay unchanged — they omit family_id and it's filled
-- here. RLS still enforces that you can only write to your own family.
-- =========================================================================
create or replace function set_family_id() returns trigger as $$
begin
  if new.family_id is null then
    new.family_id := current_family_id();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_foods_family          before insert on foods          for each row execute function set_family_id();
create trigger trg_day_plans_family       before insert on day_plans      for each row execute function set_family_id();
create trigger trg_day_slots_family       before insert on day_slots      for each row execute function set_family_id();
create trigger trg_day_slot_foods_family  before insert on day_slot_foods for each row execute function set_family_id();
create trigger trg_slot_templates_family  before insert on slot_templates for each row execute function set_family_id();
create trigger trg_cook_tokens_family     before insert on cook_tokens    for each row execute function set_family_id();
create trigger trg_settings_family        before insert on settings       for each row execute function set_family_id();

-- =========================================================================
-- ROW-LEVEL SECURITY: scope every table to the caller's family.
-- =========================================================================
alter table families enable row level security;

-- Replace the old global "family_all" / first-login policies.
drop policy if exists "family_all" on foods;
drop policy if exists "family_all" on slot_templates;
drop policy if exists "family_all" on day_plans;
drop policy if exists "family_all" on day_slots;
drop policy if exists "family_all" on day_slot_foods;
drop policy if exists "family_all" on cook_tokens;
drop policy if exists "family_all" on settings;
drop policy if exists "family_all" on family_users;
drop policy if exists "first_login_self_insert" on family_users;

create policy "family_scope" on foods          for all to authenticated using (family_id = current_family_id()) with check (family_id = current_family_id());
create policy "family_scope" on slot_templates for all to authenticated using (family_id = current_family_id()) with check (family_id = current_family_id());
create policy "family_scope" on day_plans      for all to authenticated using (family_id = current_family_id()) with check (family_id = current_family_id());
create policy "family_scope" on day_slots      for all to authenticated using (family_id = current_family_id()) with check (family_id = current_family_id());
create policy "family_scope" on day_slot_foods for all to authenticated using (family_id = current_family_id()) with check (family_id = current_family_id());
create policy "family_scope" on cook_tokens    for all to authenticated using (family_id = current_family_id()) with check (family_id = current_family_id());
create policy "family_scope" on settings       for all to authenticated using (family_id = current_family_id()) with check (family_id = current_family_id());

-- Members can read their own family + co-members. Writes go through the
-- SECURITY DEFINER functions above, so no insert/update policy is needed.
create policy "family_read" on families     for select to authenticated using (id = current_family_id());
create policy "family_read" on family_users for select to authenticated using (family_id = current_family_id());

-- The old allow-list helper is no longer referenced.
drop function if exists is_family_member();

commit;
