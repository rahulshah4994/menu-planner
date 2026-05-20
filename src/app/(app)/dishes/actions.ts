"use server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const dishSchema = z
  .object({
    name_en: z.string().trim().min(1),
    name_hi: z.string().trim().min(1),
    category: z.string().trim().min(1),
    ingredients: z.string().trim(),
    ingredients_hi: z.string().trim(),
    recipe_url: z
      .string()
      .trim()
      .url()
      .or(z.literal(""))
      .optional()
      .nullable()
      .transform((v) => (v ? v : null)),
    cuisine: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((v) => (v ? v : null)),
    tags: z.string().trim(),
    active: z.boolean(),
    is_one_pot: z.boolean(),
    meal_type: z.enum(["Breakfast", "Lunch", "Dinner"]).optional(),
    meal_weight: z.coerce.number().int().min(1).max(10).optional(),
  })
  .refine((d) => !d.is_one_pot || !!d.meal_type, {
    message: "Meal type is required for a one-pot meal",
    path: ["meal_type"],
  });

type ParsedDish = z.infer<typeof dishSchema>;

function parseFormData(fd: FormData): ParsedDish {
  return dishSchema.parse({
    name_en: fd.get("name_en"),
    name_hi: fd.get("name_hi"),
    category: fd.get("category"),
    ingredients: fd.get("ingredients") ?? "",
    ingredients_hi: fd.get("ingredients_hi") ?? "",
    recipe_url: fd.get("recipe_url") ?? "",
    cuisine: fd.get("cuisine") ?? "",
    tags: fd.get("tags") ?? "",
    active: fd.get("active") === "on",
    is_one_pot: fd.get("is_one_pot") === "on",
    meal_type: fd.get("meal_type") ?? undefined,
    meal_weight: fd.get("meal_weight") ?? undefined,
  });
}

/** Columns that belong on the `dishes` row. */
function dishRow(d: ParsedDish) {
  return {
    name_en: d.name_en,
    name_hi: d.name_hi,
    category: d.category,
    ingredients: d.ingredients,
    ingredients_hi: d.ingredients_hi,
    recipe_url: d.recipe_url,
    cuisine: d.cuisine,
    tags: d.tags,
    is_one_pot: d.is_one_pot,
    active: d.active,
  };
}

/**
 * Keep the auto-generated meal for a one-pot dish in sync:
 * - one-pot ON  → create or update the linked meal (+ meal_dishes link)
 * - one-pot OFF → archive the linked meal if one exists
 */
async function syncOnePotMeal(
  supabase: SupabaseClient,
  dishId: string,
  d: ParsedDish
) {
  const { data: existing } = await supabase
    .from("meals")
    .select("id")
    .eq("source_dish_id", dishId)
    .maybeSingle();

  if (d.is_one_pot) {
    const mealFields = {
      name_en: d.name_en,
      name_hi: d.name_hi,
      meal_type: d.meal_type!,
      weight: d.meal_weight ?? 5,
      cuisine: d.cuisine,
      tags: d.tags,
      source_dish_id: dishId,
      active: d.active,
    };
    if (existing) {
      const { error } = await supabase
        .from("meals")
        .update(mealFields)
        .eq("id", existing.id);
      if (error) throw error;
      const { error: e2 } = await supabase
        .from("meal_dishes")
        .upsert({ meal_id: existing.id, dish_id: dishId, position: 0 });
      if (e2) throw e2;
    } else {
      const { data: meal, error } = await supabase
        .from("meals")
        .insert(mealFields)
        .select("id")
        .single();
      if (error) throw error;
      const { error: e2 } = await supabase
        .from("meal_dishes")
        .insert({ meal_id: meal.id, dish_id: dishId, position: 0 });
      if (e2) throw e2;
    }
  } else if (existing) {
    const { error } = await supabase
      .from("meals")
      .update({ active: false })
      .eq("id", existing.id);
    if (error) throw error;
  }
  revalidatePath("/meals");
}

export async function createDish(fd: FormData) {
  const supabase = await createClient();
  const d = parseFormData(fd);
  const { data: dish, error } = await supabase
    .from("dishes")
    .insert(dishRow(d))
    .select("id")
    .single();
  if (error) throw error;
  await syncOnePotMeal(supabase, dish.id, d);
  revalidatePath("/dishes");
  redirect("/dishes");
}

export async function updateDish(id: string, fd: FormData) {
  const supabase = await createClient();
  const d = parseFormData(fd);
  const { error } = await supabase
    .from("dishes")
    .update(dishRow(d))
    .eq("id", id);
  if (error) throw error;
  await syncOnePotMeal(supabase, id, d);
  revalidatePath("/dishes");
  redirect("/dishes");
}

export async function deleteDish(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("dishes")
    .update({ active: false })
    .eq("id", id);
  if (error) throw error;
  // Archive the auto-generated one-pot meal alongside the dish.
  await supabase
    .from("meals")
    .update({ active: false })
    .eq("source_dish_id", id);
  revalidatePath("/dishes");
  revalidatePath("/meals");
}
