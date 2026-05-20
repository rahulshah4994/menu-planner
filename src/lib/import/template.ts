import * as XLSX from "xlsx";
import { DISH_COLUMNS, MEAL_COLUMNS } from "./catalog";

/**
 * Builds the bulk-import .xlsx template: an Instructions sheet plus Dishes
 * and Meals sheets with headers and a couple of example rows.
 */
export function buildTemplateWorkbook(): Buffer {
  const wb = XLSX.utils.book_new();

  const instructions: string[][] = [
    ["Menu Planner — Bulk Import Template"],
    [],
    ["How to use"],
    [
      "1. Fill in the Dishes and Meals sheets. The example rows show the format — edit or delete them.",
    ],
    ["2. Save the file, then upload it on Settings → Bulk import."],
    [
      "3. Rows are matched by Name (English): existing items are updated, new names are added.",
    ],
    [],
    ["Dishes columns"],
    ["Name (English)", "Required. Unique key used to match on re-import."],
    ["Name (Hindi)", "Devanagari name shown to the cook."],
    [
      "Category",
      "Free text, e.g. Component, Breakfast, Bread, Grain, Beverage, Side, Salad, Dessert.",
    ],
    ["Ingredients (English)", "Comma-separated. Drives the grocery list."],
    ["Ingredients (Hindi)", "Comma-separated Devanagari, shown to the cook."],
    ["Recipe URL", "Optional link."],
    ["Cuisine", "Free text, e.g. North Indian."],
    ["Tags", "Comma-separated."],
    ["Active", "yes or no (default yes)."],
    [],
    ["Meals columns"],
    ["Name (English)", "Required. Unique key used to match on re-import."],
    ["Name (Hindi)", "Devanagari name."],
    ["Meal Type", "Breakfast, Lunch, or Dinner."],
    [
      "Weight (1-10)",
      "Randomiser bias; higher is picked more often (default 5).",
    ],
    ["Cuisine", "Free text."],
    ["Tags", "Comma-separated."],
    ["Effort (1-5)", "Optional."],
    ["Season", "All, Summer, or Winter (default All)."],
    ["Guest-worthy", "yes or no."],
    ["Active", "yes or no (default yes)."],
    [
      "Components",
      "Comma-separated dish names — each must match a Name (English) in the Dishes sheet.",
    ],
  ];
  const insSheet = XLSX.utils.aoa_to_sheet(instructions);
  insSheet["!cols"] = [{ wch: 24 }, { wch: 82 }];
  XLSX.utils.book_append_sheet(wb, insSheet, "Instructions");

  const dishExamples = [
    [
      "Rajma",
      "राजमा",
      "Component",
      "Kidney Beans, Onion, Tomato",
      "राजमा, प्याज, टमाटर",
      "",
      "North Indian",
      "protein",
      "yes",
    ],
    ["Basmati Rice", "चावल", "Grain", "Basmati Rice", "चावल", "", "", "", "yes"],
    [
      "Masala Chai",
      "मसाला चाय",
      "Beverage",
      "Milk, Tea Leaves",
      "दूध, चायपत्ती",
      "",
      "",
      "",
      "yes",
    ],
  ];
  const dishSheet = XLSX.utils.aoa_to_sheet([DISH_COLUMNS, ...dishExamples]);
  dishSheet["!cols"] = DISH_COLUMNS.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, dishSheet, "Dishes");

  const mealExamples = [
    [
      "Rajma Rice",
      "राजमा चावल",
      "Lunch",
      7,
      "North Indian",
      "comfort",
      2,
      "All",
      "no",
      "yes",
      "Rajma, Basmati Rice",
    ],
  ];
  const mealSheet = XLSX.utils.aoa_to_sheet([MEAL_COLUMNS, ...mealExamples]);
  mealSheet["!cols"] = MEAL_COLUMNS.map(() => ({ wch: 18 }));
  XLSX.utils.book_append_sheet(wb, mealSheet, "Meals");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
