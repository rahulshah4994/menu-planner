import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { RowActions } from "@/components/row-actions";
import { deleteMeal } from "./actions";

export default async function MealsPage() {
  const supabase = await createClient();
  const { data: meals } = await supabase
    .from("meals")
    .select(`*, meal_dishes(dish:dishes(name_en))`)
    .order("name_en");

  return (
    <main>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-black">
            Meals
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Named combinations of dishes — the randomiser picks from here.
          </p>
        </div>
        <Link href="/meals/new" className="btn btn-primary">
          <Plus size={16} weight="bold" />
          New meal
        </Link>
      </header>
      <div className="table-shell">
        <table className="table-base">
          <thead>
            <tr>
              <th className="th-base">Name</th>
              <th className="th-base">Hindi</th>
              <th className="th-base">Type</th>
              <th className="th-base">Dishes</th>
              <th className="th-base">Weight</th>
              <th className="th-base">Status</th>
              <th className="th-base"></th>
            </tr>
          </thead>
          <tbody>
            {meals?.map((m) => {
              const dishes = (
                m as unknown as {
                  meal_dishes: { dish: { name_en: string } }[];
                }
              ).meal_dishes;
              return (
                <tr key={m.id} className={m.active ? "" : "opacity-40"}>
                  <td className="td-base font-medium text-black">
                    {m.name_en}
                  </td>
                  <td className="td-base text-zinc-700">{m.name_hi}</td>
                  <td className="td-base">
                    <span className="tag-soft">{m.meal_type}</span>
                  </td>
                  <td className="td-base max-w-xs truncate text-zinc-600">
                    {dishes?.map((md) => md.dish.name_en).join(", ")}
                  </td>
                  <td className="td-base text-zinc-700">{m.weight}</td>
                  <td className="td-base text-zinc-500">
                    {m.active ? "Active" : "Archived"}
                  </td>
                  <td className="td-base">
                    <RowActions
                      editHref={`/meals/${m.id}`}
                      deleteAction={deleteMeal.bind(null, m.id)}
                      itemLabel={m.name_en}
                    />
                  </td>
                </tr>
              );
            })}
            {meals?.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-12 text-center text-zinc-500"
                >
                  No meals yet. Add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
