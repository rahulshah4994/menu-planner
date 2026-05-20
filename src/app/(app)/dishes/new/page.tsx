import { DishForm } from "../dish-form";
import { createDish } from "../actions";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CUISINES,
  mergeOptions,
  collectTags,
} from "@/lib/options";

export default async function NewDishPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;
  const initial = name ? { name_en: name } : undefined;

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("dishes")
    .select("category, cuisine, tags");
  const r = rows ?? [];

  return (
    <main>
      <h1 className="mb-6 text-2xl font-bold">New dish</h1>
      <DishForm
        initial={initial}
        categoryOptions={mergeOptions(
          DEFAULT_CATEGORIES,
          r.map((x) => x.category)
        )}
        cuisineOptions={mergeOptions(
          DEFAULT_CUISINES,
          r.map((x) => x.cuisine)
        )}
        tagOptions={collectTags(r)}
        action={createDish}
      />
    </main>
  );
}
