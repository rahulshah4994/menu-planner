#!/usr/bin/env node
/**
 * Excel import — bulk-load dishes + meals from an .xlsx file.
 *
 * Usage:
 *   npx tsx scripts/import-xlsx.ts path/to/menu.xlsx
 *
 * Expected sheets:
 *
 *   "Dishes" with columns:
 *     Name (English) | Name (Hindi) | Category | Ingredients
 *     | Recipe URL | Cuisine | Tags | Active
 *
 *   "Meals" with columns:
 *     Name (English) | Name (Hindi) | Meal Type | Weight (1-10)
 *     | Cuisine | Tags | Effort (1-5) | Season | Guest-worthy
 *     | Active | Components
 *
 *   Components column: comma-separated dish names (must match the Dishes sheet).
 *
 * Requires env vars in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

// Load .env.local manually (Node 22+ supports --env-file, this is safer)
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  }
}
loadEnv();

const file = process.argv[2];
if (!file) {
  console.error("Usage: tsx scripts/import-xlsx.ts <path-to-xlsx>");
  process.exit(1);
}
if (!fs.existsSync(file)) {
  console.error(`File not found: ${file}`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

type DishRow = {
  name_en: string;
  name_hi: string;
  category: string;
  ingredients: string;
  recipe_url: string | null;
  cuisine: string | null;
  tags: string;
  active: boolean;
};

type MealRow = {
  name_en: string;
  name_hi: string;
  meal_type: string;
  weight: number;
  cuisine: string | null;
  tags: string;
  effort: number | null;
  season: string;
  guest_worthy: boolean;
  active: boolean;
  components: string[]; // dish names
};

function s(v: unknown): string {
  return v == null ? "" : String(v).trim();
}
function n(v: unknown): number | null {
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}
function b(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const t = String(v ?? "").trim().toLowerCase();
  return t === "yes" || t === "true" || t === "1";
}

function parseSheet(workbook: XLSX.WorkBook, name: string): Record<string, unknown>[] {
  const sheet = workbook.Sheets[name];
  if (!sheet) {
    console.error(`Sheet "${name}" not found.`);
    return [];
  }
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

async function main() {
  console.log(`Reading ${file}…`);
  const workbook = XLSX.readFile(file);

  const dishRowsRaw = parseSheet(workbook, "Dishes");
  const mealRowsRaw = parseSheet(workbook, "Meals");

  const dishes: DishRow[] = dishRowsRaw
    .map((r) => ({
      name_en: s(r["Name (English)"] ?? r["Name"] ?? r["name_en"]),
      name_hi: s(r["Name (Hindi)"] ?? r["name_hi"]),
      category: s(r["Category"] ?? r["category"]) || "Component",
      ingredients: s(r["Ingredients"] ?? r["ingredients"]),
      recipe_url: s(r["Recipe URL"] ?? r["recipe_url"]) || null,
      cuisine: s(r["Cuisine"] ?? r["cuisine"]) || null,
      tags: s(r["Tags"] ?? r["tags"]),
      active: b(r["Active"] ?? r["active"] ?? "yes"),
    }))
    .filter((d) => d.name_en);

  const meals: MealRow[] = mealRowsRaw
    .map((r) => {
      const components = s(r["Components"] ?? r["components"])
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      return {
        name_en: s(r["Name (English)"] ?? r["Name"] ?? r["name_en"]),
        name_hi: s(r["Name (Hindi)"] ?? r["name_hi"]),
        meal_type: s(r["Meal Type"] ?? r["meal_type"]) || "Lunch",
        weight: n(r["Weight (1-10)"] ?? r["Weight"] ?? r["weight"]) ?? 5,
        cuisine: s(r["Cuisine"] ?? r["cuisine"]) || null,
        tags: s(r["Tags"] ?? r["tags"]),
        effort: n(r["Effort (1-5)"] ?? r["Effort"] ?? r["effort"]),
        season: s(r["Season"] ?? r["season"]) || "All",
        guest_worthy: b(r["Guest-worthy"] ?? r["guest_worthy"]),
        active: b(r["Active"] ?? r["active"] ?? "yes"),
        components,
      };
    })
    .filter((m) => m.name_en);

  console.log(`Parsed ${dishes.length} dishes and ${meals.length} meals.`);

  // --- Upsert dishes ---
  for (const d of dishes) {
    const { error } = await supabase
      .from("dishes")
      .upsert(d, { onConflict: "name_en" });
    if (error) console.error(`  ! dish ${d.name_en}: ${error.message}`);
    else console.log(`  ✓ dish ${d.name_en}`);
  }

  // Build name → id lookup for component resolution
  const { data: allDishes } = await supabase
    .from("dishes")
    .select("id, name_en");
  const byName = new Map<string, string>();
  for (const x of (allDishes ?? []) as { id: string; name_en: string }[]) {
    byName.set(x.name_en.toLowerCase(), x.id);
  }

  // --- Upsert meals ---
  for (const m of meals) {
    const { components, ...mealFields } = m;
    const { data: meal, error } = await supabase
      .from("meals")
      .upsert(mealFields, { onConflict: "name_en" })
      .select("id")
      .single();
    if (error || !meal) {
      console.error(`  ! meal ${m.name_en}: ${error?.message}`);
      continue;
    }

    // Replace meal_dishes set
    await supabase.from("meal_dishes").delete().eq("meal_id", meal.id);
    const dishIds: { meal_id: string; dish_id: string; position: number }[] = [];
    let pos = 0;
    for (const dishName of components) {
      const dishId = byName.get(dishName.toLowerCase());
      if (!dishId) {
        console.warn(
          `    ⚠ meal "${m.name_en}" references missing dish "${dishName}" — skipping`
        );
        continue;
      }
      dishIds.push({ meal_id: meal.id, dish_id: dishId, position: pos++ });
    }
    if (dishIds.length > 0) {
      const { error: e2 } = await supabase
        .from("meal_dishes")
        .insert(dishIds);
      if (e2) console.error(`  ! meal_dishes for ${m.name_en}: ${e2.message}`);
    }
    console.log(`  ✓ meal ${m.name_en} (${dishIds.length} dishes)`);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
