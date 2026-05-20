-- Add Bread, Grain, Snack to the dish_category enum.
-- Run this in the Supabase SQL Editor.

alter type dish_category add value if not exists 'Bread';
alter type dish_category add value if not exists 'Grain';
alter type dish_category add value if not exists 'Snack';
