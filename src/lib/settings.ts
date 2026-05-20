import { createClient } from "@/lib/supabase/server";

export interface AppSettings {
  planning_horizon_days: number;
  viewer_horizon_days: number;
  deadline_time: string;
  household_size: number;
  no_repeat_days_breakfast: number;
  no_repeat_days_lunch: number;
  no_repeat_days_dinner: number;
}

const DEFAULTS: AppSettings = {
  planning_horizon_days: 7,
  viewer_horizon_days: 3,
  deadline_time: "21:00:00",
  household_size: 2,
  no_repeat_days_breakfast: 5,
  no_repeat_days_lunch: 7,
  no_repeat_days_dinner: 7,
};

export async function getSettings(): Promise<AppSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return DEFAULTS;
  return data as AppSettings;
}

export function noRepeatDaysForSlot(
  settings: AppSettings,
  slot: "Breakfast" | "Lunch" | "Dinner"
): number {
  switch (slot) {
    case "Breakfast":
      return settings.no_repeat_days_breakfast;
    case "Lunch":
      return settings.no_repeat_days_lunch;
    case "Dinner":
      return settings.no_repeat_days_dinner;
  }
}
