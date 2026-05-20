import { SupabaseClient } from "@supabase/supabase-js";
import { addDays, formatISODate, parseISODate } from "@/lib/dates";
import { noRepeatDaysForSlot, type AppSettings } from "@/lib/settings";

type Slot = "Breakfast" | "Lunch" | "Dinner";

interface PickOpts {
  excludeMealIds?: Set<string>;
}

/**
 * Pick one meal id for (slot, date):
 * 1. Pool = active meals whose meal_type === slot
 * 2. Exclude meals already planned within `no_repeat_days_<slot>` days of `date`
 * 3. Weighted random by `meal.weight`
 * 4. Fallback if pool empty after exclusion: least-recently-planned
 * 5. Returns null if there are no meals at all in that meal_type
 */
export async function pickMeal(
  supabase: SupabaseClient,
  slot: Slot,
  date: string,
  settings: AppSettings,
  opts: PickOpts = {}
): Promise<string | null> {
  // Lunch and Dinner share a pool — either type is eligible for both slots.
  const eligibleTypes: Slot[] =
    slot === "Lunch" || slot === "Dinner" ? ["Lunch", "Dinner"] : [slot];
  const { data: meals } = await supabase
    .from("meals")
    .select("id, weight")
    .in("meal_type", eligibleTypes)
    .eq("active", true);

  if (!meals || meals.length === 0) return null;

  const noRepeat = noRepeatDaysForSlot(settings, slot);
  const sinceDate = formatISODate(addDays(parseISODate(date), -noRepeat));

  const { data: recent } = await supabase
    .from("meal_plan_meals")
    .select("meal_id, meal_plans!inner(date)")
    .gte("meal_plans.date", sinceDate);

  const excluded = new Set<string>(opts.excludeMealIds ?? []);
  for (const r of recent ?? []) {
    excluded.add((r as { meal_id: string }).meal_id);
  }

  let pool = meals.filter(
    (m: { id: string; weight: number }) => !excluded.has(m.id)
  );

  // Fallback: pool emptied by exclusions — take least-recently-planned of all
  if (pool.length === 0) {
    const recentIds = new Set<string>(
      (recent ?? []).map((r) => (r as { meal_id: string }).meal_id)
    );
    pool = meals.filter((m) => !recentIds.has(m.id));
    if (pool.length === 0) pool = meals;
  }

  // Weighted random
  const totalWeight = pool.reduce(
    (s: number, m: { weight: number }) => s + Math.max(1, m.weight),
    0
  );
  let r = Math.random() * totalWeight;
  for (const m of pool) {
    r -= Math.max(1, m.weight);
    if (r <= 0) return m.id;
  }
  return pool[pool.length - 1].id;
}
