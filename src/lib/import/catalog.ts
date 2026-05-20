import type { SupabaseClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

// Column headers — shared with the downloadable template so both stay in sync.
export const DISH_COLUMNS = [
  "Name (English)",
  "Name (Hindi)",
  "Category",
  "Ingredients (English)",
  "Ingredients (Hindi)",
  "Recipe URL",
  "Cuisine",
  "Tags",
  "Active",
];

export const MEAL_COLUMNS = [
  "Name (English)",
  "Name (Hindi)",
  "Meal Type",
  "Weight (1-10)",
  "Cuisine",
  "Tags",
  "Effort (1-5)",
  "Season",
  "Guest-worthy",
  "Active",
  "Components",
];

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"];
const SEASONS = ["All", "Summer", "Winter"];

export interface ImportSummary {
  ok: boolean;
  error?: string;
  dishes: { inserted: number; updated: number };
  meals: { inserted: number; updated: number };
  warnings: string[];
}

type Row = Record<string, unknown>;

function s(v: unknown): string {
  return v == null ? "" : String(v).trim();
}
/** First non-empty value among the candidate column names. */
function pick(row: Row, keys: string[]): unknown {
  for (const k of keys) if (row[k] != null && row[k] !== "") return row[k];
  return "";
}
function num(v: unknown): number | null {
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}
function bool(v: unknown, dflt: boolean): boolean {
  const t = s(v).toLowerCase();
  if (t === "") return dflt;
  return t === "yes" || t === "true" || t === "1" || t === "y";
}
function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

/**
 * Parse an uploaded .xlsx and upsert its Dishes + Meals into the catalog.
 * Rows are matched by Name (English) — existing rows update, new ones insert.
 * Never throws on a bad row; problems are collected into `warnings`.
 */
export async function importCatalogFromBuffer(
  supabase: SupabaseClient,
  buf: Buffer
): Promise<ImportSummary> {
  const warnings: string[] = [];
  const wb = XLSX.read(buf, { type: "buffer" });

  const dishSheet = wb.Sheets["Dishes"];
  const mealSheet = wb.Sheets["Meals"];
  if (!dishSheet && !mealSheet) {
    return {
      ok: false,
      error: 'No "Dishes" or "Meals" sheet found in the file.',
      dishes: { inserted: 0, updated: 0 },
      meals: { inserted: 0, updated: 0 },
      warnings,
    };
  }

  const dishRows = dishSheet
    ? (XLSX.utils.sheet_to_json(dishSheet, { defval: "" }) as Row[])
    : [];
  const mealRows = mealSheet
    ? (XLSX.utils.sheet_to_json(mealSheet, { defval: "" }) as Row[])
    : [];

  // ----- Dishes -----
  const dishes = { inserted: 0, updated: 0 };
  const { data: existingDishes } = await supabase
    .from("dishes")
    .select("id, name_en");
  const dishIdByName = new Map<string, string>();
  for (const d of (existingDishes ?? []) as { id: string; name_en: string }[]) {
    dishIdByName.set(d.name_en.toLowerCase(), d.id);
  }

  for (const r of dishRows) {
    const name_en = s(pick(r, ["Name (English)", "Name", "name_en"]));
    if (!name_en) continue; // blank row

    const dish = {
      name_en,
      name_hi: s(pick(r, ["Name (Hindi)", "name_hi"])),
      category: s(pick(r, ["Category", "category"])) || "Component",
      ingredients: s(
        pick(r, ["Ingredients (English)", "Ingredients", "ingredients"])
      ),
      ingredients_hi: s(pick(r, ["Ingredients (Hindi)", "ingredients_hi"])),
      recipe_url: s(pick(r, ["Recipe URL", "recipe_url"])) || null,
      cuisine: s(pick(r, ["Cuisine", "cuisine"])) || null,
      tags: s(pick(r, ["Tags", "tags"])),
      active: bool(pick(r, ["Active", "active"]), true),
    };

    const existingId = dishIdByName.get(name_en.toLowerCase());
    if (existingId) {
      const { error } = await supabase
        .from("dishes")
        .update(dish)
        .eq("id", existingId);
      if (error) warnings.push(`Dish "${name_en}": ${error.message}`);
      else dishes.updated++;
    } else {
      const { data, error } = await supabase
        .from("dishes")
        .insert(dish)
        .select("id")
        .single();
      if (error || !data) {
        warnings.push(`Dish "${name_en}": ${error?.message ?? "insert failed"}`);
      } else {
        dishIdByName.set(name_en.toLowerCase(), data.id);
        dishes.inserted++;
      }
    }
  }

  // ----- Meals -----
  const meals = { inserted: 0, updated: 0 };
  const { data: existingMeals } = await supabase
    .from("meals")
    .select("id, name_en");
  const mealIdByName = new Map<string, string>();
  for (const m of (existingMeals ?? []) as { id: string; name_en: string }[]) {
    mealIdByName.set(m.name_en.toLowerCase(), m.id);
  }

  for (const r of mealRows) {
    const name_en = s(pick(r, ["Name (English)", "Name", "name_en"]));
    if (!name_en) continue;

    let meal_type = s(pick(r, ["Meal Type", "meal_type"])) || "Lunch";
    if (!MEAL_TYPES.includes(meal_type)) {
      warnings.push(
        `Meal "${name_en}": unknown meal type "${meal_type}" — set to Lunch.`
      );
      meal_type = "Lunch";
    }
    let season = s(pick(r, ["Season", "season"])) || "All";
    if (!SEASONS.includes(season)) {
      warnings.push(`Meal "${name_en}": unknown season "${season}" — set to All.`);
      season = "All";
    }
    const weightRaw = num(pick(r, ["Weight (1-10)", "Weight", "weight"]));
    const effortRaw = num(pick(r, ["Effort (1-5)", "Effort", "effort"]));

    const meal = {
      name_en,
      name_hi: s(pick(r, ["Name (Hindi)", "name_hi"])),
      meal_type,
      weight: weightRaw == null ? 5 : clamp(Math.round(weightRaw), 1, 10),
      cuisine: s(pick(r, ["Cuisine", "cuisine"])) || null,
      tags: s(pick(r, ["Tags", "tags"])),
      effort: effortRaw == null ? null : clamp(Math.round(effortRaw), 1, 5),
      season,
      guest_worthy: bool(pick(r, ["Guest-worthy", "guest_worthy"]), false),
      active: bool(pick(r, ["Active", "active"]), true),
    };
    const components = s(pick(r, ["Components", "components"]))
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    let mealId = mealIdByName.get(name_en.toLowerCase());
    if (mealId) {
      const { error } = await supabase
        .from("meals")
        .update(meal)
        .eq("id", mealId);
      if (error) {
        warnings.push(`Meal "${name_en}": ${error.message}`);
        continue;
      }
      meals.updated++;
    } else {
      const { data, error } = await supabase
        .from("meals")
        .insert(meal)
        .select("id")
        .single();
      if (error || !data) {
        warnings.push(`Meal "${name_en}": ${error?.message ?? "insert failed"}`);
        continue;
      }
      mealId = String(data.id);
      mealIdByName.set(name_en.toLowerCase(), mealId);
      meals.inserted++;
    }

    // Replace the meal's component dishes.
    await supabase.from("meal_dishes").delete().eq("meal_id", mealId);
    const links: { meal_id: string; dish_id: string; position: number }[] = [];
    const seen = new Set<string>();
    let pos = 0;
    for (const dishName of components) {
      const dishId = dishIdByName.get(dishName.toLowerCase());
      if (!dishId) {
        warnings.push(
          `Meal "${name_en}": component "${dishName}" not found — skipped.`
        );
        continue;
      }
      if (seen.has(dishId)) continue;
      seen.add(dishId);
      links.push({ meal_id: mealId, dish_id: dishId, position: pos++ });
    }
    if (links.length > 0) {
      const { error } = await supabase.from("meal_dishes").insert(links);
      if (error) {
        warnings.push(`Meal "${name_en}" components: ${error.message}`);
      }
    }
  }

  return { ok: true, dishes, meals, warnings };
}
