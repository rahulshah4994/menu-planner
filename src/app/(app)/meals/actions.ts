"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const mealSchema = z.object({
  name_en: z.string().trim().min(1),
  name_hi: z.string().trim().min(1),
  meal_type: z.enum(["Breakfast", "Lunch", "Evening Snack", "Dinner"]),
  weight: z.coerce.number().int().min(1).max(10),
  cuisine: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  tags: z.string().trim(),
  effort: z
    .union([z.coerce.number().int().min(1).max(5), z.literal("")])
    .transform((v) => (v === "" ? null : v))
    .nullable(),
  season: z.enum(["All", "Summer", "Winter"]),
  guest_worthy: z.boolean(),
  active: z.boolean(),
});

function parseFormData(fd: FormData) {
  const dish_ids_raw = String(fd.get("dish_ids") ?? "");
  const dish_ids = dish_ids_raw ? dish_ids_raw.split(",").filter(Boolean) : [];

  return {
    fields: mealSchema.parse({
      name_en: fd.get("name_en"),
      name_hi: fd.get("name_hi"),
      meal_type: fd.get("meal_type"),
      weight: fd.get("weight"),
      cuisine: fd.get("cuisine") ?? "",
      tags: fd.get("tags") ?? "",
      effort: fd.get("effort") ?? "",
      season: fd.get("season"),
      guest_worthy: fd.get("guest_worthy") === "yes",
      active: fd.get("active") === "on",
    }),
    dish_ids,
  };
}

export async function createMeal(fd: FormData) {
  const supabase = await createClient();
  const { fields, dish_ids } = parseFormData(fd);
  const { data: meal, error } = await supabase
    .from("meals")
    .insert(fields)
    .select("id")
    .single();
  if (error) throw error;

  if (dish_ids.length > 0) {
    const rows = dish_ids.map((dish_id, position) => ({
      meal_id: meal.id,
      dish_id,
      position,
    }));
    const { error: e2 } = await supabase.from("meal_dishes").insert(rows);
    if (e2) throw e2;
  }
  revalidatePath("/meals");
  redirect("/meals");
}

export async function updateMeal(id: string, fd: FormData) {
  const supabase = await createClient();
  const { fields, dish_ids } = parseFormData(fd);
  const { error } = await supabase
    .from("meals")
    .update(fields)
    .eq("id", id);
  if (error) throw error;

  await supabase.from("meal_dishes").delete().eq("meal_id", id);
  if (dish_ids.length > 0) {
    const rows = dish_ids.map((dish_id, position) => ({
      meal_id: id,
      dish_id,
      position,
    }));
    const { error: e2 } = await supabase.from("meal_dishes").insert(rows);
    if (e2) throw e2;
  }
  revalidatePath("/meals");
  redirect("/meals");
}

export async function deleteMeal(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("meals")
    .update({ active: false })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/meals");
}
