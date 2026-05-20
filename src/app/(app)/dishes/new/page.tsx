import { DishForm } from "../dish-form";
import { createDish } from "../actions";

export default async function NewDishPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;
  const initial = name ? { name_en: name } : undefined;
  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold">New dish</h1>
      <DishForm initial={initial} action={createDish} />
    </main>
  );
}
