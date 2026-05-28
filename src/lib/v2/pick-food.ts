import { SupabaseClient } from "@supabase/supabase-js";
import { addDaysISO, dayPlanId } from "./ids";
import { type AppSettings } from "@/lib/settings";

interface PickOpts {
  excludeFoodIds?: Set<string>;
}

interface FoodRow {
  id: string;
  weight: number;
  categories: string[];
}

/** No-repeat days for a v2 slot name. Falls back to the breakfast setting
 *  when the slot name doesn't map to one of the canonical three. */
function noRepeatDaysFor(settings: AppSettings, slotName: string): number {
  switch (slotName.trim().toLowerCase()) {
    case "lunch":
      return settings.no_repeat_days_lunch;
    case "dinner":
      return settings.no_repeat_days_dinner;
    case "breakfast":
    default:
      return settings.no_repeat_days_breakfast;
  }
}

/**
 * Pick one food id for (slot category, date):
 * 1. Pool = active foods whose `categories` (case-insensitive) include slotName
 * 2. Exclude foods placed within the no-repeat window for that slot
 * 3. Weighted random by `food.weight`
 * 4. Fallback if pool empties: least-recently-planned of the eligible set
 * 5. Returns null if no eligible foods exist
 */
export async function pickFood(
  supabase: SupabaseClient,
  slotName: string,
  date: string,
  settings: AppSettings,
  opts: PickOpts = {}
): Promise<string | null> {
  const slotKey = slotName.trim().toLowerCase();
  if (!slotKey) return null;

  const { data: foodData } = await supabase
    .from("foods")
    .select("id, weight, categories")
    .eq("active", true);
  const all = (foodData ?? []) as FoodRow[];
  const eligible = all.filter((f) =>
    (f.categories ?? []).some((c) => c.trim().toLowerCase() === slotKey)
  );
  if (eligible.length === 0) return null;

  const noRepeat = noRepeatDaysFor(settings, slotName);
  const windowPlanIds: number[] = [];
  for (let i = 1; i <= noRepeat; i++) {
    windowPlanIds.push(dayPlanId(addDaysISO(date, -i)));
  }

  const excluded = new Set<string>(opts.excludeFoodIds ?? []);
  if (windowPlanIds.length) {
    const { data: recent } = await supabase
      .from("day_slot_foods")
      .select("food_id, day_slots!inner(day_plan_id)")
      .in("day_slots.day_plan_id", windowPlanIds);
    for (const r of (recent ?? []) as { food_id: string }[]) {
      excluded.add(r.food_id);
    }
  }

  let pool = eligible.filter((f) => !excluded.has(f.id));
  if (pool.length === 0) pool = eligible;

  const totalWeight = pool.reduce((s, f) => s + Math.max(1, f.weight), 0);
  let r = Math.random() * totalWeight;
  for (const f of pool) {
    r -= Math.max(1, f.weight);
    if (r <= 0) return f.id;
  }
  return pool[pool.length - 1].id;
}
