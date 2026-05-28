-- 0009: drop the v1 schema. The v2 model (foods, day_plans, day_slots,
-- day_slot_foods, slot_templates) is now the only thing the app reads.
-- Shared tables (settings, family_users, cook_tokens) are kept.
-- Run this AFTER deploying the v1-code removal so no live route queries
-- these tables.

drop table if exists meal_plan_addons;
drop table if exists meal_plan_meals;
drop table if exists meal_plans;
drop table if exists meal_dishes;
drop table if exists meals;
drop table if exists dishes;
drop table if exists grocery_items;

-- v1 enum type (only meal_plans referenced it).
drop type if exists meal_type;

-- Trim settings columns that only the v1 randomiser used.
alter table settings drop column if exists no_repeat_days_evening_snack;
