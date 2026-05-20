import { MealForm } from "../meal-form";
import { createMeal } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CUISINES, mergeOptions, collectTags } from "@/lib/options";

export default async function NewMealPage() {
  const supabase = await createClient();
  const [{ data: dishes }, { data: rows }] = await Promise.all([
    supabase
      .from("dishes")
      .select("id, name_en, name_hi, category")
      .eq("active", true)
      .order("name_en"),
    supabase.from("meals").select("cuisine, tags"),
  ]);
  const r = rows ?? [];

  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold">New meal</h1>
      <MealForm
        allDishes={dishes ?? []}
        cuisineOptions={mergeOptions(
          DEFAULT_CUISINES,
          r.map((x) => x.cuisine)
        )}
        tagOptions={collectTags(r)}
        action={createMeal}
      />
    </main>
  );
}
