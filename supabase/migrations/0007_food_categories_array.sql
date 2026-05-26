-- Convert foods.category (single text) to foods.categories (text[]).
-- Multiselect on the v2 food form means a food can belong to multiple categories.

alter table foods add column categories text[] not null default '{}';

update foods
set categories = case
  when coalesce(category, '') = '' then '{}'::text[]
  else array[category]
end;

alter table foods drop column category;

create index idx_foods_categories on foods using gin (categories);
