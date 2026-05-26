import type { SupabaseClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

export const FOOD_COLUMNS = [
  "Name (English)",
  "Name (Hindi)",
  "Categories",
  "Ingredients (English)",
  "Ingredients (Hindi)",
  "Recipe URL",
  "Weight (1-10)",
  "Notes",
  "Active",
];

export interface FoodsImportSummary {
  ok: boolean;
  error?: string;
  foods: { inserted: number; updated: number };
  warnings: string[];
}

type Row = Record<string, unknown>;

function s(v: unknown): string {
  return v == null ? "" : String(v).trim();
}
function num(v: unknown, dflt: number): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : dflt;
}
function bool(v: unknown, dflt: boolean): boolean {
  const t = s(v).toLowerCase();
  if (t === "") return dflt;
  return t === "yes" || t === "true" || t === "1" || t === "y";
}
function splitList(v: unknown): string[] {
  return s(v)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function buildFoodsTemplateWorkbook(): Buffer {
  const wb = XLSX.utils.book_new();

  const instructions: string[][] = [
    ["Menu Planner v2 — Bulk Food Import"],
    [],
    ["How to use"],
    [
      "1. Fill in the Foods sheet. The example rows show the format — edit or delete them.",
    ],
    ["2. Save the file, then upload it on Settings → Bulk import."],
    [
      "3. Rows are matched by Name (English): existing items are updated, new names are added.",
    ],
    [],
    ["Columns"],
    ["Name (English)", "Required. Unique key used to match on re-import."],
    ["Name (Hindi)", "Devanagari name shown to the cook."],
    ["Categories", "Comma-separated. Free text, e.g. Lunch, Side."],
    ["Ingredients (English)", "Comma-separated."],
    ["Ingredients (Hindi)", "Comma-separated Devanagari."],
    ["Recipe URL", "Optional link."],
    ["Weight (1-10)", "Default 5."],
    ["Notes", "Optional free text."],
    ["Active", "yes or no (default yes)."],
  ];
  const insSheet = XLSX.utils.aoa_to_sheet(instructions);
  insSheet["!cols"] = [{ wch: 24 }, { wch: 82 }];
  XLSX.utils.book_append_sheet(wb, insSheet, "Instructions");

  const examples = [
    [
      "Rajma Chawal",
      "राजमा चावल",
      "Lunch, Dinner",
      "Kidney Beans, Rice, Onion, Tomato",
      "राजमा, चावल, प्याज, टमाटर",
      "",
      7,
      "",
      "yes",
    ],
    [
      "Masala Chai",
      "मसाला चाय",
      "Beverage",
      "Milk, Tea Leaves, Sugar",
      "दूध, चायपत्ती, चीनी",
      "",
      5,
      "",
      "yes",
    ],
  ];
  const sheet = XLSX.utils.aoa_to_sheet([FOOD_COLUMNS, ...examples]);
  sheet["!cols"] = FOOD_COLUMNS.map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, sheet, "Foods");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export async function importFoodsFromBuffer(
  supabase: SupabaseClient,
  buf: Buffer
): Promise<FoodsImportSummary> {
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets["Foods"];
  if (!sheet) {
    return {
      ok: false,
      error: "Missing sheet: Foods.",
      foods: { inserted: 0, updated: 0 },
      warnings: [],
    };
  }

  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
  const warnings: string[] = [];

  const { data: existing } = await supabase.from("foods").select("id,name");
  const byName = new Map<string, string>();
  for (const r of (existing ?? []) as { id: string; name: string }[]) {
    byName.set(r.name.toLowerCase(), r.id);
  }

  let inserted = 0;
  let updated = 0;

  for (const [i, row] of rows.entries()) {
    const name = s(row["Name (English)"]);
    if (!name) {
      warnings.push(`Foods row ${i + 2}: missing name — skipped.`);
      continue;
    }
    const payload = {
      name,
      name_hi: s(row["Name (Hindi)"]),
      categories: splitList(row["Categories"]),
      ingredients: s(row["Ingredients (English)"]),
      ingredients_hi: s(row["Ingredients (Hindi)"]),
      recipe_url: s(row["Recipe URL"]) || null,
      weight: Math.max(1, Math.min(10, num(row["Weight (1-10)"], 5))),
      notes: s(row["Notes"]),
      active: bool(row["Active"], true),
    };

    const existingId = byName.get(name.toLowerCase());
    if (existingId) {
      const { error } = await supabase
        .from("foods")
        .update(payload)
        .eq("id", existingId);
      if (error) {
        warnings.push(`Foods row ${i + 2} (${name}): ${error.message}`);
        continue;
      }
      updated++;
    } else {
      const { error } = await supabase.from("foods").insert(payload);
      if (error) {
        warnings.push(`Foods row ${i + 2} (${name}): ${error.message}`);
        continue;
      }
      inserted++;
    }
  }

  return {
    ok: true,
    foods: { inserted, updated },
    warnings,
  };
}
