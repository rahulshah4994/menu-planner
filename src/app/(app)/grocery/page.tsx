import {
  Plus,
  ArrowsClockwise,
  Eraser,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import {
  regenerateFromPlanner,
  addGroceryItem,
  clearTicked,
  clearAll,
} from "./actions";
import { GroceryRow, type GroceryItem } from "./grocery-row";

export default async function GroceryPage() {
  const supabase = await createClient();
  const settings = await getSettings();
  const { data: items } = await supabase
    .from("grocery_items")
    .select("*")
    .order("ticked", { ascending: true })
    .order("name", { ascending: true });

  const list = (items ?? []) as unknown as GroceryItem[];
  const remaining = list.filter((i) => !i.ticked).length;
  const ticked = list.length - remaining;

  return (
    <main>
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-black">
          Grocery list
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {remaining} to buy · {ticked} ticked
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <form action={() => regenerateFromPlanner()}>
          <button type="submit" className="btn btn-primary">
            <ArrowsClockwise size={16} weight="bold" />
            Regenerate from planner
          </button>
        </form>
        <span className="text-xs text-zinc-500">
          (next {settings.planning_horizon_days} days · adds missing names,
          keeps existing state)
        </span>
      </div>

      <form
        action={(fd) => addGroceryItem(String(fd.get("name") ?? ""))}
        className="mb-4 flex gap-2"
      >
        <input
          name="name"
          placeholder="Add an item manually"
          className="input flex-1 text-sm"
        />
        <button type="submit" className="btn btn-secondary">
          <Plus size={16} weight="bold" />
          Add
        </button>
      </form>

      <div className="rounded-md border border-zinc-200 bg-white">
        {list.length === 0 ? (
          <p className="px-3 py-12 text-center text-sm text-zinc-500">
            No items yet. Hit{" "}
            <strong className="text-zinc-700">
              Regenerate from planner
            </strong>{" "}
            to populate from your upcoming meals.
          </p>
        ) : (
          list.map((it) => <GroceryRow key={it.id} item={it} />)
        )}
      </div>

      {list.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {ticked > 0 && (
            <form
              action={clearTicked}
              onSubmit={(e) => {
                if (!confirm("Remove all ticked items?")) e.preventDefault();
              }}
            >
              <button type="submit" className="btn btn-secondary">
                <Eraser size={14} weight="bold" />
                Clear ticked ({ticked})
              </button>
            </form>
          )}
          <form
            action={clearAll}
            onSubmit={(e) => {
              if (!confirm("Wipe the entire grocery list? This cannot be undone."))
                e.preventDefault();
            }}
          >
            <button
              type="submit"
              className="btn btn-secondary text-red-700 hover:text-red-700"
            >
              <Eraser size={14} weight="bold" />
              Clear all
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
