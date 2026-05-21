import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import {
  addDaysISO,
  dateLabel,
  dayPlanId,
  slotId,
  todayISO,
} from "@/lib/v2/ids";
import type { DaySlot, FoodLite, SlotTemplate } from "@/lib/v2/types";

export const dynamic = "force-dynamic";

export default async function V2ViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { token } = await params;
  const { date: dateParam } = await searchParams;

  const supabase = createServiceClient();
  const { data: tok } = await supabase
    .from("cook_tokens")
    .select("token, revoked")
    .eq("token", token)
    .maybeSingle();
  if (!tok || tok.revoked) notFound();

  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : todayISO();
  const id = dayPlanId(date);

  const { data: slotData } = await supabase
    .from("day_slots")
    .select("*")
    .eq("day_plan_id", id)
    .order("position");
  let slots = (slotData ?? []) as DaySlot[];
  const planned = slots.length > 0;

  // Day not planned yet — preview the default slots, empty.
  if (!planned) {
    const { data: tpl } = await supabase
      .from("slot_templates")
      .select("*")
      .order("position");
    slots = ((tpl ?? []) as SlotTemplate[]).map((t, i) => ({
      id: slotId(id, i + 1),
      day_plan_id: id,
      slot_no: i + 1,
      name: t.name,
      color: t.color,
      position: i + 1,
      created_at: "",
    }));
  }

  const bySlot = new Map<number, FoodLite[]>();
  if (planned && slots.length) {
    const { data: sf } = await supabase
      .from("day_slot_foods")
      .select("day_slot_id, position, food:foods(id,name,name_hi,category)")
      .in(
        "day_slot_id",
        slots.map((s) => s.id)
      )
      .order("position");
    for (const r of (sf ?? []) as unknown as {
      day_slot_id: number;
      food: FoodLite | null;
    }[]) {
      if (!r.food) continue;
      const arr = bySlot.get(r.day_slot_id) ?? [];
      arr.push(r.food);
      bySlot.set(r.day_slot_id, arr);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white px-5 py-6">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-black">
          Menu
        </h1>
        <div className="mt-3 flex items-center gap-2">
          <Link
            href={`/v2/viewer/${token}?date=${addDaysISO(date, -1)}`}
            className="rounded-md border border-zinc-300 p-2 text-zinc-600 hover:border-black hover:text-black"
            aria-label="Previous day"
          >
            ←
          </Link>
          <span className="flex-1 text-center text-sm font-medium text-zinc-700">
            {dateLabel(date)}
          </span>
          <Link
            href={`/v2/viewer/${token}?date=${addDaysISO(date, 1)}`}
            className="rounded-md border border-zinc-300 p-2 text-zinc-600 hover:border-black hover:text-black"
            aria-label="Next day"
          >
            →
          </Link>
        </div>
      </header>

      <div className="space-y-3">
        {slots.map((s) => {
          const foods = bySlot.get(s.id) ?? [];
          return (
            <section
              key={s.id}
              className="rounded-lg border border-zinc-200 p-4"
              style={{ backgroundColor: s.color }}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-black">
                {s.name}
              </h2>
              {foods.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-500">
                  — nothing planned —
                </p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {foods.map((f) => (
                    <li key={f.id} className="text-sm text-zinc-800">
                      {f.name}
                      {f.name_hi && (
                        <span className="ml-1.5 text-zinc-500">
                          {f.name_hi}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
        {slots.length === 0 && (
          <p className="text-sm text-zinc-400">Nothing set up yet.</p>
        )}
      </div>

      <footer className="mt-12 border-t border-zinc-200 pt-4 text-xs text-zinc-400">
        Menu Planner v2 · read-only view
      </footer>
    </main>
  );
}
