import { DishForm } from "../dish-form";
import { updateDish } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CUISINES,
  mergeOptions,
  collectTags,
} from "@/lib/options";

export default async function EditDishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: dish }, { data: rows }, { data: meal }] = await Promise.all([
    supabase.from("dishes").select("*").eq("id", id).single(),
    supabase.from("dishes").select("category, cuisine, tags"),
    supabase
      .from("meals")
      .select("meal_type, weight")
      .eq("source_dish_id", id)
      .maybeSingle(),
  ]);
  if (!dish) notFound();
  const r = rows ?? [];

  const update = updateDish.bind(null, id);

  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold">Edit dish</h1>
      <DishForm
        initial={dish}
        initialMeal={meal ?? null}
        categoryOptions={mergeOptions(
          DEFAULT_CATEGORIES,
          r.map((x) => x.category)
        )}
        cuisineOptions={mergeOptions(
          DEFAULT_CUISINES,
          r.map((x) => x.cuisine)
        )}
        tagOptions={collectTags(r)}
        action={update}
      />
    </main>
  );
}
