import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mergeCategories } from "@/lib/v2/categories";
import type { Food } from "@/lib/v2/types";
import { FoodForm } from "../food-form";
import { updateFood } from "../actions";

export default async function EditFoodPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: food }, { data: cats }] = await Promise.all([
    supabase.from("foods").select("*").eq("id", id).single(),
    supabase.from("foods").select("categories"),
  ]);
  if (!food) notFound();

  const fromDb = ((cats ?? []) as { categories: string[] | null }[])
    .flatMap((r) => r.categories ?? [])
    .filter(Boolean);
  const categories = mergeCategories(fromDb);

  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold">Edit food</h1>
      <FoodForm
        initial={food as Food}
        categories={categories}
        action={updateFood.bind(null, id)}
      />
    </main>
  );
}
