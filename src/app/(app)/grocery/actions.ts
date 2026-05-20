"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { aggregateIngredients } from "@/lib/grocery/aggregate";
import { addDays, formatISODate } from "@/lib/dates";
import { getSettings } from "@/lib/settings";

export async function regenerateFromPlanner(daysOverride?: number) {
  const supabase = await createClient();
  const settings = await getSettings();
  const days = daysOverride ?? settings.planning_horizon_days;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startISO = formatISODate(today);
  const endISO = formatISODate(addDays(today, days));

  const aggregated = await aggregateIngredients(supabase, startISO, endISO);

  // Upsert each new name (existing keys keep their quantity/ticked state)
  if (aggregated.size > 0) {
    const rows = Array.from(aggregated.entries()).map(([key, name]) => ({
      name,
      name_key: key,
    }));
    const { error } = await supabase
      .from("grocery_items")
      .upsert(rows, { onConflict: "name_key", ignoreDuplicates: true });
    if (error) throw error;
  }
  revalidatePath("/grocery");
}

export async function addGroceryItem(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const supabase = await createClient();
  await supabase
    .from("grocery_items")
    .upsert(
      { name: trimmed, name_key: trimmed.toLowerCase() },
      { onConflict: "name_key", ignoreDuplicates: true }
    );
  revalidatePath("/grocery");
}

export async function toggleTicked(id: string, ticked: boolean) {
  const supabase = await createClient();
  await supabase.from("grocery_items").update({ ticked }).eq("id", id);
  revalidatePath("/grocery");
}

export async function updateQuantity(id: string, quantity: string) {
  const supabase = await createClient();
  await supabase
    .from("grocery_items")
    .update({ quantity: quantity.trim() || null })
    .eq("id", id);
  revalidatePath("/grocery");
}

export async function updateNotes(id: string, notes: string) {
  const supabase = await createClient();
  await supabase
    .from("grocery_items")
    .update({ notes: notes.trim() || null })
    .eq("id", id);
  revalidatePath("/grocery");
}

export async function deleteGroceryItem(id: string) {
  const supabase = await createClient();
  await supabase.from("grocery_items").delete().eq("id", id);
  revalidatePath("/grocery");
}

export async function clearTicked() {
  const supabase = await createClient();
  await supabase.from("grocery_items").delete().eq("ticked", true);
  revalidatePath("/grocery");
}

export async function clearAll() {
  const supabase = await createClient();
  await supabase.from("grocery_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  revalidatePath("/grocery");
}
