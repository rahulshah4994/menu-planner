import Link from "next/link";
import { PencilSimple, Archive, ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import type { Food } from "@/lib/v2/types";
import { archiveFood, unarchiveFood } from "./actions";
import { CategoryCell } from "./category-cell";
import { ShowArchivedToggle } from "./show-archived-toggle";

export default async function FoodsPage({
  searchParams,
}: {
  searchParams: Promise<{ showArchived?: string }>;
}) {
  const { showArchived } = await searchParams;
  const showAll = showArchived === "1";

  const supabase = await createClient();
  const query = supabase.from("foods").select("*").order("name");
  const { data } = await (showAll ? query : query.eq("active", true));
  const foods = (data ?? []) as Food[];

  return (
    <main>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-black">
            Foods
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            The catalog you fill meal slots from.
          </p>
        </div>
        <Link href="/foods/new" className="btn btn-primary">
          New food
        </Link>
      </header>

      <div className="mb-3 flex justify-end">
        <ShowArchivedToggle showArchived={showAll} />
      </div>

      <div className="table-shell overflow-x-auto">
        <table className="table-base min-w-[40rem]">
          <thead>
            <tr>
              <th className="th-base">Name</th>
              <th className="th-base">Hindi</th>
              <th className="th-base">Categories</th>
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
                <td className="td-base">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/foods/${f.id}`}
                      title="Edit"
                      className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-black"
                    >
                      <PencilSimple size={16} weight="bold" />
                    </Link>
                    {f.active ? (
                      <form action={archiveFood.bind(null, f.id)}>
                        <button
                          title="Archive"
                          className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-red-700"
                        >
                          <Archive size={16} weight="bold" />
                        </button>
                      </form>
                    ) : (
                      <form action={unarchiveFood.bind(null, f.id)}>
                        <button
                          title="Unarchive"
                          className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-emerald-700"
                        >
                          <ArrowCounterClockwise size={16} weight="bold" />
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
                  colSpan={4}
                  className="px-3 py-12 text-center text-zinc-500"
                >
                  {showAll ? "No foods found." : "No foods yet. Add your first one."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
