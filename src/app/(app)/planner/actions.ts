"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { pickMeal } from "@/lib/randomiser/pick-meal";
import { getSettings } from "@/lib/settings";

type Slot = "Breakfast" | "Lunch" | "Evening Snack" | "Dinner";
const SLOTS: Slot[] = ["Breakfast", "Lunch", "Evening Snack", "Dinner"];

async function ensurePlanRow(date: string, slot: Slot) {
  const supabase = await createClient();
  // Single round-trip: upsert returns the existing row's id if present,
  // otherwise inserts and returns the new id.
  const { data, error } = await supabase
    .from("meal_plans")
    .upsert({ date, slot }, { onConflict: "date,slot" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

// ----- slot-level mutations -----

export async function addMealToSlot(
  date: string,
  slot: Slot,
  meal_id: string
) {
  const supabase = await createClient();
  const planId = await ensurePlanRow(date, slot);
  // Find next position
  const { data: existing } = await supabase
    .from("meal_plan_meals")
    .select("position")
    .eq("meal_plan_id", planId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (existing?.position ?? -1) + 1;
  await supabase
    .from("meal_plan_meals")
    .insert({ meal_plan_id: planId, meal_id, position });
  revalidatePath("/planner");
}

export async function removeMealFromSlot(
  date: string,
  slot: Slot,
  meal_id: string
) {
  const supabase = await createClient();
  const planId = await ensurePlanRow(date, slot);
  await supabase
    .from("meal_plan_meals")
    .delete()
    .eq("meal_plan_id", planId)
    .eq("meal_id", meal_id);
  revalidatePath("/planner");
}

export async function addAddonToSlot(
  date: string,
  slot: Slot,
  dish_id: string
) {
  const supabase = await createClient();
  const planId = await ensurePlanRow(date, slot);
  await supabase
    .from("meal_plan_addons")
    .upsert({ meal_plan_id: planId, dish_id });
  revalidatePath("/planner");
}

export async function removeAddonFromSlot(
  date: string,
  slot: Slot,
  dish_id: string
) {
  const supabase = await createClient();
  const planId = await ensurePlanRow(date, slot);
  await supabase
    .from("meal_plan_addons")
    .delete()
    .eq("meal_plan_id", planId)
    .eq("dish_id", dish_id);
  revalidatePath("/planner");
}

export async function setEatingOut(
  date: string,
  slot: Slot,
  eating_out: boolean
) {
  const supabase = await createClient();
  const planId = await ensurePlanRow(date, slot);
  await supabase
    .from("meal_plans")
    .update({ eating_out })
    .eq("id", planId);
  revalidatePath("/planner");
}

export async function setGuests(
  date: string,
  slot: Slot,
  guests: number
) {
  const supabase = await createClient();
  const planId = await ensurePlanRow(date, slot);
  await supabase
    .from("meal_plans")
    .update({ guests: Math.max(0, Math.min(50, guests)) })
    .eq("id", planId);
  revalidatePath("/planner");
}

export async function setNote(date: string, slot: Slot, note: string) {
  const supabase = await createClient();
  const planId = await ensurePlanRow(date, slot);
  await supabase
    .from("meal_plans")
    .update({ today_note: note || null })
    .eq("id", planId);
  revalidatePath("/planner");
}

export async function clearSlot(date: string, slot: Slot) {
  const supabase = await createClient();
  await supabase
    .from("meal_plans")
    .delete()
    .eq("date", date)
    .eq("slot", slot);
  revalidatePath("/planner");
}

// ----- randomiser -----

export async function randomiseSlot(date: string, slot: Slot) {
  const supabase = await createClient();
  const settings = await getSettings();
  const id = await pickMeal(supabase, slot, date, settings);
  if (!id) return;

  // Replace the slot's meals with just this one (single pick)
  const planId = await ensurePlanRow(date, slot);
  await supabase
    .from("meal_plan_meals")
    .delete()
    .eq("meal_plan_id", planId);
  await supabase
    .from("meal_plan_meals")
    .insert({ meal_plan_id: planId, meal_id: id, position: 0 });
  // Make sure eating-out is off if we just planned a meal here
  await supabase
    .from("meal_plans")
    .update({ eating_out: false })
    .eq("id", planId);
  revalidatePath("/planner");
}

export async function randomiseDay(date: string) {
  const supabase = await createClient();
  const settings = await getSettings();
  // Find empty slots only (or no meals yet)
  for (const slot of SLOTS) {
    const planId = await ensurePlanRow(date, slot);
    const { data: existing } = await supabase
      .from("meal_plan_meals")
      .select("meal_id")
      .eq("meal_plan_id", planId)
      .limit(1);
    const { data: plan } = await supabase
      .from("meal_plans")
      .select("eating_out")
      .eq("id", planId)
      .single();
    if (plan?.eating_out) continue;
    if (existing && existing.length > 0) continue;
    const id = await pickMeal(supabase, slot, date, settings);
    if (!id) continue;
    await supabase
      .from("meal_plan_meals")
      .insert({ meal_plan_id: planId, meal_id: id, position: 0 });
  }
  revalidatePath("/planner");
}

export async function randomiseRange(startDate: string, days: number) {
  // Iterate days in order — important because pickMeal uses history,
  // and we want today's pick to influence tomorrow's no-repeat.
  for (let i = 0; i < days; i++) {
    const d = new Date(`${startDate}T00:00:00`);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    await randomiseDay(`${y}-${m}-${day}`);
  }
}
