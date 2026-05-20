-- Optional seed: a handful of dishes + one meal so you can poke around before
-- adding your real data. Run AFTER 0001_init.sql.

insert into dishes (name_en, name_hi, category, ingredients) values
  ('Rajma',           'राजमा',           'Component', 'Kidney beans, Onion, Tomato, Ginger-Garlic, Garam Masala'),
  ('Rice',            'चावल',            'Component', 'Basmati rice'),
  ('Raita',           'रायता',           'Side',      'Yogurt, Cucumber, Cumin powder, Mint'),
  ('Kachumber',       'कचुम्बर',         'Salad',     'Cucumber, Tomato, Onion, Lemon, Salt'),
  ('Masala Chai',     'मसाला चाय',       'Beverage',  'Milk, Tea leaves, Sugar, Ginger, Cardamom'),
  ('Gulab Jamun',     'गुलाब जामुन',     'Dessert',   'Khoya, Sugar syrup, Cardamom');

with rajma_rice as (
  insert into meals (name_en, name_hi, meal_type, weight)
  values ('Rajma Rice', 'राजमा चावल', 'Lunch', 7)
  returning id
)
insert into meal_dishes (meal_id, dish_id, position)
select rajma_rice.id, d.id, row_number() over () - 1
from rajma_rice, dishes d
where d.name_en in ('Rajma', 'Rice', 'Raita');
