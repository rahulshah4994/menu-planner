import { createClient } from "@/lib/supabase/server";
import { FoodForm } from "../food-form";
import { createFood } from "../actions";

export default async function NewFoodPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("foods").select("category");
  const categories = [
    ...new Set(
      ((data ?? []) as { category: string }[])
        .map((r) => r.category)
        .filter(Boolean)
    ),
  ].sort();

  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold">New food</h1>
      <FoodForm categories={categories} action={createFood} />
    </main>
  );
}
