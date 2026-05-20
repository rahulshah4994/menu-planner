"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const dishSchema = z.object({
  name_en: z.string().trim().min(1),
  name_hi: z.string().trim().min(1),
  category: z.enum([
    "Component",
    "Bread",
    "Grain",
    "Snack",
    "Beverage",
    "Side",
    "Salad",
    "Dessert",
  ]),
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
});

function parseFormData(fd: FormData) {
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
  });
}

export async function createDish(fd: FormData) {
  const supabase = await createClient();
  const dish = parseFormData(fd);
  const { error } = await supabase.from("dishes").insert(dish);
  if (error) throw error;
  revalidatePath("/dishes");
  redirect("/dishes");
}

export async function updateDish(id: string, fd: FormData) {
  const supabase = await createClient();
  const dish = parseFormData(fd);
  const { error } = await supabase.from("dishes").update(dish).eq("id", id);
  if (error) throw error;
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
  revalidatePath("/dishes");
}
