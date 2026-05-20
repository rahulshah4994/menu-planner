-- Add Hindi (Devanagari) ingredients alongside the English ones.
-- English stays as-is for grocery aggregation; Hindi is shown in the cook's Viewer.

alter table dishes
  add column if not exists ingredients_hi text not null default '';
