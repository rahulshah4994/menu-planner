import { MealForm } from "../meal-form";
import { createMeal } from "../actions";
import { createClient } from "@/lib/supabase/server";

export default async function NewMealPage() {
  const supabase = await createClient();
  const { data: dishes } = await supabase
    .from("dishes")
    .select("id, name_en, name_hi, category")
    .eq("active", true)
    .order("name_en");

  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold">New meal</h1>
      <MealForm allDishes={dishes ?? []} action={createMeal} />
    </main>
  );
}
