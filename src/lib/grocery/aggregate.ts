import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Walks meal_plans in [startISO, endISO), collects all unique ingredient names
 * from meal-component dishes + add-on dishes, skipping eating-out slots.
 *
 * Returns Map<name_key, name> — keyed by lower-cased name, value is the first
 * capitalization seen (so the display name is human-readable).
 */
export async function aggregateIngredients(
  supabase: SupabaseClient,
  startISO: string,
  endISO: string
): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("meal_plans")
    .select(
      `eating_out,
       meal_plan_meals (
         meal:meals (
           meal_dishes (
             dish:dishes ( ingredients )
           )
         )
       ),
       meal_plan_addons (
         dish:dishes ( ingredients )
       )`
    )
    .gte("date", startISO)
    .lt("date", endISO);

  if (error) throw error;

  type Row = {
    eating_out: boolean;
    meal_plan_meals?: {
      meal: { meal_dishes?: { dish: { ingredients: string } }[] };
    }[];
    meal_plan_addons?: { dish: { ingredients: string } }[];
  };

  const out = new Map<string, string>();
  const add = (raw: string) => {
    for (const piece of (raw ?? "").split(",")) {
      const name = piece.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (!out.has(key)) out.set(key, name);
    }
  };

  for (const p of (data ?? []) as unknown as Row[]) {
    if (p.eating_out) continue;
    for (const mpm of p.meal_plan_meals ?? []) {
      for (const md of mpm.meal?.meal_dishes ?? []) {
        add(md.dish?.ingredients ?? "");
      }
    }
    for (const mpa of p.meal_plan_addons ?? []) {
      add(mpa.dish?.ingredients ?? "");
    }
  }
  return out;
}
