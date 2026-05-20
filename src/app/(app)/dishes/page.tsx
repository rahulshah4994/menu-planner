import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { RowActions } from "@/components/row-actions";
import { deleteDish } from "./actions";

export default async function DishesPage() {
  const supabase = await createClient();
  const { data: dishes } = await supabase
    .from("dishes")
    .select("*")
    .order("name_en");

  return (
    <main>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-black">
            Dishes
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Atomic items. Combine them into meals on the next page.
          </p>
        </div>
        <Link href="/dishes/new" className="btn btn-primary">
          <Plus size={16} weight="bold" />
          New dish
        </Link>
      </header>
      <div className="table-shell">
        <table className="table-base">
          <thead>
            <tr>
              <th className="th-base">Name</th>
              <th className="th-base">Hindi</th>
              <th className="th-base">Category</th>
              <th className="th-base">Ingredients</th>
              <th className="th-base">Status</th>
              <th className="th-base"></th>
            </tr>
          </thead>
          <tbody>
            {dishes?.map((d) => (
              <tr key={d.id} className={d.active ? "" : "opacity-40"}>
                <td className="td-base font-medium text-black">{d.name_en}</td>
                <td className="td-base text-zinc-700">{d.name_hi}</td>
                <td className="td-base">
                  <span className="tag-soft">{d.category}</span>
                </td>
                <td className="td-base max-w-xs truncate text-zinc-600">
                  {d.ingredients}
                </td>
                <td className="td-base text-zinc-500">
                  {d.active ? "Active" : "Archived"}
                </td>
                <td className="td-base">
                  <RowActions
                    editHref={`/dishes/${d.id}`}
                    deleteAction={deleteDish.bind(null, d.id)}
                    itemLabel={d.name_en}
                  />
                </td>
              </tr>
            ))}
            {dishes?.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-12 text-center text-zinc-500"
                >
                  No dishes yet. Add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
