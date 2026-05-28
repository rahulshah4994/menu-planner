/**
 * Generate a test bulk-import workbook for v2 Foods.
 *   tsx scripts/gen-test-foods.ts
 * Writes ./test-foods.xlsx in the repo root.
 *
 * Every row covers at least one slot category (Breakfast/Lunch/Dinner/Snack).
 * Hindi columns are intentionally blank to exercise the LLM autofill.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as XLSX from "xlsx";
import { FOOD_COLUMNS } from "../src/lib/v2/import";

type Row = [
  string, // Name (English)
  string, // Name (Hindi) — blank
  string, // Categories
  string, // Ingredients (English)
  string, // Ingredients (Hindi) — blank
  string, // Recipe URL
  number, // Weight
  string, // Notes
  string, // Active
];

const rows: Row[] = [
  // Breakfast
  ["Poha", "", "Breakfast, High Fibre", "Flattened Rice, Onion, Peanut", "", "", 6, "", "yes"],
  ["Upma", "", "Breakfast, High Fibre", "Semolina, Onion, Peas", "", "", 6, "", "yes"],
  ["Masala Dosa", "", "Breakfast, Cheat Meal", "Dosa Batter, Potato", "", "", 7, "", "yes"],
  ["Plain Dosa", "", "Breakfast", "Dosa Batter", "", "", 6, "", "yes"],
  ["Rava Dosa", "", "Breakfast", "Semolina, Rice Flour, Onion", "", "", 6, "", "yes"],
  ["Idli Sambar", "", "Breakfast, Lunch, High Protein", "Idli Batter, Toor Dal, Drumstick", "", "", 8, "", "yes"],
  ["Medu Vada", "", "Breakfast, Snack, High Protein", "Urad Dal", "", "", 6, "", "yes"],
  ["Pesarattu", "", "Breakfast, High Protein, High Fibre", "Green Moong Dal", "", "", 7, "Andhra-style green-gram crepe", "yes"],
  ["Aloo Paratha", "", "Breakfast, Comfort Food", "Atta, Potato", "", "", 8, "Serve with yogurt", "yes"],
  ["Methi Paratha", "", "Breakfast, High Fibre", "Atta, Fenugreek Leaves", "", "", 7, "", "yes"],
  ["Besan Chilla", "", "Breakfast, High Protein, High Fibre", "Besan, Onion, Tomato", "", "", 8, "", "yes"],
  ["Paneer Bhurji", "", "Breakfast, Dinner, High Protein", "Paneer, Onion, Tomato", "", "", 7, "Pairs well with paratha", "yes"],
  ["Masala Omelette", "", "Breakfast, High Protein", "Eggs, Onion, Tomato", "", "", 8, "", "yes"],
  ["Sabudana Khichdi", "", "Breakfast, Comfort Food", "Sabudana, Potato, Peanut", "", "", 6, "Fasting-friendly", "yes"],
  ["Thepla", "", "Breakfast, Snack", "Atta, Fenugreek Leaves, Yogurt", "", "", 7, "", "yes"],

  // Lunch
  ["Rajma Chawal", "", "Lunch, Dinner, High Protein, Comfort Food", "Kidney Beans, Rice, Onion, Tomato", "", "", 9, "", "yes"],
  ["Chole Bhature", "", "Lunch, Cheat Meal", "Chickpeas, Atta", "", "", 5, "Heavy — schedule on weekends", "yes"],
  ["Dal Tadka with Jeera Rice", "", "Lunch, Dinner, High Protein", "Toor Dal, Basmati Rice", "", "", 8, "", "yes"],
  ["Dal Makhani", "", "Lunch, Dinner, Cheat Meal, High Protein", "Urad Dal, Kidney Beans, Cream, Butter", "", "", 6, "", "yes"],
  ["Palak Paneer", "", "Lunch, Dinner, High Protein, High Fibre", "Paneer, Spinach", "", "", 7, "", "yes"],
  ["Paneer Butter Masala", "", "Lunch, Dinner, Cheat Meal, High Protein", "Paneer, Tomato, Cream", "", "", 6, "", "yes"],
  ["Kadhi Pakora", "", "Lunch, Comfort Food", "Yogurt, Besan", "", "", 6, "", "yes"],
  ["Bhindi Masala", "", "Lunch, High Fibre", "", "", "", 6, "Generate ingredients from name", "yes"],
  ["Aloo Gobhi", "", "Lunch, Dinner, High Fibre", "Potato, Cauliflower, Peas", "", "", 6, "", "yes"],
  ["Baingan Bharta", "", "Lunch, Dinner, High Fibre", "Eggplant, Onion, Tomato", "", "", 6, "", "yes"],
  ["Veg Biryani", "", "Lunch, Dinner, Cheat Meal", "Basmati Rice, Mixed Vegetables, Yogurt", "", "", 6, "", "yes"],
  ["Chicken Biryani", "", "Lunch, Dinner, Cheat Meal, High Protein", "Basmati Rice, Chicken, Yogurt", "", "", 7, "", "yes"],
  ["Sambar Rice", "", "Lunch, High Protein, High Fibre", "Rice, Toor Dal, Mixed Vegetables", "", "", 7, "", "yes"],
  ["Curd Rice", "", "Lunch, Comfort Food", "Rice, Yogurt", "", "", 6, "Cooling — good for hot days", "yes"],
  ["Pav Bhaji", "", "Lunch, Cheat Meal", "", "", "", 5, "Generate ingredients from name", "yes"],

  // Dinner
  ["Khichdi", "", "Dinner, Comfort Food", "Rice, Moong Dal", "", "", 7, "Light dinner option", "yes"],
  ["Egg Curry with Roti", "", "Dinner, High Protein", "Eggs, Onion, Tomato, Atta", "", "", 7, "", "yes"],
  ["Butter Chicken", "", "Dinner, Cheat Meal, High Protein", "Chicken, Tomato, Cream, Butter", "", "", 5, "Cheat night", "yes"],
  ["Chicken Curry", "", "Dinner, High Protein", "Chicken, Onion, Tomato", "", "", 7, "", "yes"],
  ["Fish Curry", "", "Dinner, High Protein", "Fish, Onion, Tomato, Coconut", "", "", 7, "", "yes"],
  ["Mutton Rogan Josh", "", "Dinner, Cheat Meal, High Protein", "Mutton, Yogurt, Onion", "", "", 5, "", "yes"],
  ["Chana Masala", "", "Dinner, High Protein, High Fibre", "Chickpeas, Onion, Tomato", "", "", 7, "", "yes"],
  ["Mixed Veg Sabzi with Roti", "", "Dinner, High Fibre", "Mixed Vegetables, Atta", "", "", 7, "", "yes"],
  ["Paneer Tikka Masala", "", "Dinner, Cheat Meal, High Protein", "Paneer, Yogurt, Tomato", "", "", 6, "", "yes"],
  ["Tomato Soup with Bread", "", "Dinner, Comfort Food", "Tomato, Bread", "", "", 6, "Light winter dinner", "yes"],

  // Snacks
  ["Chana Chaat", "", "Snack, High Protein, High Fibre", "Chickpeas, Onion, Cucumber", "", "", 7, "", "yes"],
  ["Sprouts Salad", "", "Snack, Breakfast, High Protein, High Fibre", "Mung Sprouts, Onion, Cucumber, Tomato", "", "", 8, "", "yes"],
  ["Bhel Puri", "", "Snack, Cheat Meal", "", "", "", 5, "Generate ingredients from name", "yes"],
  ["Sev Puri", "", "Snack, Cheat Meal", "Puri, Potato, Sev", "", "", 5, "", "yes"],
  ["Pani Puri", "", "Snack, Cheat Meal", "", "", "", 5, "Generate ingredients from name", "yes"],
  ["Vada Pav", "", "Snack, Cheat Meal", "Pav, Potato, Besan", "", "", 5, "", "yes"],
  ["Samosa", "", "Snack, Cheat Meal", "Maida, Potato, Peas", "", "", 5, "", "yes"],
  ["Dhokla", "", "Snack, Breakfast, High Protein", "Besan, Yogurt", "", "", 7, "Steamed — healthy snack", "yes"],
  ["Masala Chai", "", "Snack, Beverage", "Milk, Tea Leaves", "", "", 6, "", "yes"],
  ["Lassi", "", "Snack, Beverage", "Yogurt, Milk", "", "", 6, "", "yes"],
];

const wb = XLSX.utils.book_new();
const sheet = XLSX.utils.aoa_to_sheet([FOOD_COLUMNS, ...rows]);
sheet["!cols"] = FOOD_COLUMNS.map(() => ({ wch: 28 }));
XLSX.utils.book_append_sheet(wb, sheet, "Foods");

const out = resolve(process.cwd(), "test-foods.xlsx");
writeFileSync(out, XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
console.log(`Wrote ${rows.length} rows → ${out}`);
