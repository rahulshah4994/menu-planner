-- 0008: per-slot overrides for the v2 parallel day-plan model.
-- - people_eating: nullable override of settings.household_size for this slot
-- - notes:         freeform cook-facing note (e.g. "less spicy today")
-- - eating_out:    when true, the slot's foods are suppressed in the viewer

alter table day_slots
  add column people_eating smallint
    check (people_eating is null or (people_eating between 0 and 50)),
  add column notes text not null default '',
  add column eating_out boolean not null default false;
