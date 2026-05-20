import { SupabaseClient } from "@supabase/supabase-js";
import { pickMeal } from "./pick-meal";
import type { AppSettings } from "@/lib/settings";
import { addDays, formatISODate } from "@/lib/dates";

type Slot = "Breakfast" | "Lunch" | "Dinner";
const SLOTS: Slot[] = ["Breakfast", "Lunch", "Dinner"];

/**
 * For each date in [startDate, startDate + days), ensure a meal_plans row
 * exists for each slot and fill any empty (non-eating-out) ones via pickMeal.
 *
 * Uses the supplied Supabase client — caller is responsible for passing one
 * that has the right privileges (service-role for cron, authenticated for UI).
 */
export async function fillEmptySlotsAcrossRange(
  supabase: SupabaseClient,
  settings: AppSettings,
  startDate: string,
  days: number
): Promise<{ filled: number; skipped: number }> {
  let filled = 0;
  let skipped = 0;

  for (let i = 0; i < days; i++) {
    const d = addDays(new Date(`${startDate}T00:00:00`), i);
    const iso = formatISODate(d);

    for (const slot of SLOTS) {
      // Ensure plan row
      const { data: existing } = await supabase
        .from("meal_plans")
        .select("id, eating_out")
        .eq("date", iso)
        .eq("slot", slot)
        .maybeSingle();

      let planId = existing?.id;
      const eatingOut = existing?.eating_out ?? false;
      if (!planId) {
        const { data: inserted, error } = await supabase
          .from("meal_plans")
          .insert({ date: iso, slot })
          .select("id")
          .single();
        if (error || !inserted) {
          skipped++;
          continue;
        }
        planId = inserted.id;
      }
      if (eatingOut) {
        skipped++;
        continue;
      }

      // Skip if any meals already attached
      const { data: existingMeals } = await supabase
        .from("meal_plan_meals")
        .select("meal_id")
        .eq("meal_plan_id", planId)
        .limit(1);
      if (existingMeals && existingMeals.length > 0) {
        skipped++;
        continue;
      }

      const mealId = await pickMeal(supabase, slot, iso, settings);
      if (!mealId) {
        skipped++;
        continue;
      }
      await supabase
        .from("meal_plan_meals")
        .insert({ meal_plan_id: planId, meal_id: mealId, position: 0 });
      filled++;
    }
  }
  return { filled, skipped };
}
