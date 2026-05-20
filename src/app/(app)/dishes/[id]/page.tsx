import { DishForm } from "../dish-form";
import { updateDish } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function EditDishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: dish } = await supabase
    .from("dishes")
    .select("*")
    .eq("id", id)
    .single();
  if (!dish) notFound();

  const update = updateDish.bind(null, id);

  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold">Edit dish</h1>
      <DishForm initial={dish} action={update} />
    </main>
  );
}
