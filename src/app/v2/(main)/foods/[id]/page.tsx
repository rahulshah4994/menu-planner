import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    supabase.from("foods").select("category"),
  ]);
  if (!food) notFound();

  const categories = [
    ...new Set(
      ((cats ?? []) as { category: string }[])
        .map((r) => r.category)
        .filter(Boolean)
    ),
  ].sort();

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
