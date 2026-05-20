import { MealForm } from "../meal-form";
import { updateMeal } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { DEFAULT_CUISINES, mergeOptions, collectTags } from "@/lib/options";

export default async function EditMealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [
    { data: meal },
    { data: dishes },
    { data: mealDishes },
    { data: rows },
  ] = await Promise.all([
    supabase.from("meals").select("*").eq("id", id).single(),
    supabase
      .from("dishes")
      .select("id, name_en, name_hi, category")
      .eq("active", true)
      .order("name_en"),
    supabase
      .from("meal_dishes")
      .select("dish_id, position")
      .eq("meal_id", id)
      .order("position"),
    supabase.from("meals").select("cuisine, tags"),
  ]);
  if (!meal) notFound();
  const initialDishIds = mealDishes?.map((md) => md.dish_id) ?? [];
  const r = rows ?? [];
  const update = updateMeal.bind(null, id);

  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold">Edit meal</h1>
      <MealForm
        initial={meal}
        initialDishIds={initialDishIds}
        allDishes={dishes ?? []}
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
