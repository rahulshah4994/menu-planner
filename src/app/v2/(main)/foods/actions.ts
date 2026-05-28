"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(1),
  name_hi: z.string().trim(),
  categories: z.array(z.string().trim().min(1)).default([]),
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
  weight: z.coerce.number().int().min(1).max(10),
  notes: z.string().trim(),
  active: z.boolean(),
});

function parse(fd: FormData) {
  const categories = fd
    .getAll("categories")
    .map((v) => String(v).trim())
    .filter(Boolean);
  return schema.parse({
    name: fd.get("name"),
    name_hi: fd.get("name_hi") ?? "",
    categories,
    ingredients: fd.get("ingredients") ?? "",
    ingredients_hi: fd.get("ingredients_hi") ?? "",
    recipe_url: fd.get("recipe_url") ?? "",
    weight: fd.get("weight") ?? 5,
    notes: fd.get("notes") ?? "",
    active: fd.get("active") === "on",
  });
}

export async function createFood(fd: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("foods").insert(parse(fd));
  if (error) throw error;
  revalidatePath("/v2/foods");
  redirect("/v2/foods");
}

export async function updateFood(id: string, fd: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("foods").update(parse(fd)).eq("id", id);
  if (error) throw error;
  revalidatePath("/v2/foods");
  redirect("/v2/foods");
}

export async function deleteFood(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("foods")
    .update({ active: false })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/v2/foods");
}
