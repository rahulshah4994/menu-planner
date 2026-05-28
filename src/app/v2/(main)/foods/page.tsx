import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Food } from "@/lib/v2/types";
import { deleteFood } from "./actions";
import { CategoryCell } from "./category-cell";

export default async function FoodsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("foods").select("*").order("name");
  const foods = (data ?? []) as Food[];

  return (
    <main>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-black">
            Foods
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            The catalog you fill meal slots from.
          </p>
        </div>
        <Link href="/v2/foods/new" className="btn btn-primary">
          New food
        </Link>
      </header>

      <div className="table-shell overflow-x-auto">
        <table className="table-base min-w-[40rem]">
          <thead>
            <tr>
              <th className="th-base">Name</th>
              <th className="th-base">Hindi</th>
              <th className="th-base">Categories</th>
              <th className="th-base">Status</th>
              <th className="th-base"></th>
            </tr>
          </thead>
          <tbody>
            {foods.map((f) => (
              <tr key={f.id} className={f.active ? "" : "opacity-40"}>
                <td className="td-base font-medium text-black">{f.name}</td>
                <td className="td-base text-zinc-700">{f.name_hi}</td>
                <td className="td-base">
                  <CategoryCell categories={f.categories ?? []} />
                </td>
                <td className="td-base text-zinc-500">
                  {f.active ? "Active" : "Archived"}
                </td>
                <td className="td-base">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/v2/foods/${f.id}`}
                      className="text-sm font-medium text-black underline"
                    >
                      Edit
                    </Link>
                    {f.active && (
                      <form action={deleteFood.bind(null, f.id)}>
                        <button className="text-sm text-zinc-500 hover:text-red-700">
                          Archive
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {foods.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-12 text-center text-zinc-500"
                >
                  No foods yet. Add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
