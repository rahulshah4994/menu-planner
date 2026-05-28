import { createClient } from "@/lib/supabase/server";
import { mergeCategories } from "@/lib/v2/categories";
import { FoodForm } from "../food-form";
import { createFood } from "../actions";

export default async function NewFoodPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("foods").select("categories");
  const fromDb = ((data ?? []) as { categories: string[] | null }[])
    .flatMap((r) => r.categories ?? [])
    .filter(Boolean);
  const categories = mergeCategories(fromDb);

  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold">New food</h1>
      <FoodForm categories={categories} action={createFood} />
    </main>
  );
}
