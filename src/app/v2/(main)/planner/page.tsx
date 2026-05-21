import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  addDaysISO,
  dateLabel,
  dayPlanId,
  slotId,
  todayISO,
} from "@/lib/v2/ids";
import type {
  DaySlot,
  FoodLite,
  SlotTemplate,
  SlotWithFoods,
} from "@/lib/v2/types";
import { DayPlanner } from "./day-planner";

export const dynamic = "force-dynamic";

export default async function V2PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : todayISO();
  const id = dayPlanId(date);
  const supabase = await createClient();

  // Ensure the day exists.
  await supabase
    .from("day_plans")
    .upsert({ id, plan_date: date }, { onConflict: "id" });

  // Seed slots from the template the first time a day is opened.
  let { data: slotData } = await supabase
    .from("day_slots")
    .select("*")
    .eq("day_plan_id", id)
    .order("position");
  if (!slotData || slotData.length === 0) {
    const { data: templates } = await supabase
      .from("slot_templates")
      .select("*")
      .order("position");
    const tpl = (templates ?? []) as SlotTemplate[];
    if (tpl.length > 0) {
      await supabase.from("day_slots").insert(
        tpl.map((t, i) => ({
          id: slotId(id, i + 1),
          day_plan_id: id,
          slot_no: i + 1,
          name: t.name,
          color: t.color,
          position: i + 1,
        }))
      );
      slotData = (
        await supabase
          .from("day_slots")
          .select("*")
          .eq("day_plan_id", id)
          .order("position")
      ).data;
    }
  }
  const slots = (slotData ?? []) as DaySlot[];

  // Foods placed in those slots.
  const slotIds = slots.map((s) => s.id);
  const { data: sfData } = slotIds.length
    ? await supabase
        .from("day_slot_foods")
        .select(
          "day_slot_id, position, food:foods(id,name,name_hi,category)"
        )
        .in("day_slot_id", slotIds)
        .order("position")
    : { data: [] };
  const bySlot = new Map<number, FoodLite[]>();
  for (const row of (sfData ?? []) as unknown as {
    day_slot_id: number;
    food: FoodLite | null;
  }[]) {
    if (!row.food) continue;
    const arr = bySlot.get(row.day_slot_id) ?? [];
    arr.push(row.food);
    bySlot.set(row.day_slot_id, arr);
  }
  const slotsWithFoods: SlotWithFoods[] = slots.map((s) => ({
    ...s,
    foods: bySlot.get(s.id) ?? [],
  }));

  // Catalog for the picker.
  const { data: foodData } = await supabase
    .from("foods")
    .select("id,name,name_hi,category")
    .eq("active", true)
    .order("name");
  const allFoods = (foodData ?? []) as FoodLite[];

  return (
    <main>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl">
            Planner
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {dateLabel(date)} · plan #{id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/v2/planner?date=${addDaysISO(date, -1)}`}
            className="btn btn-secondary"
            aria-label="Previous day"
          >
            ←
          </Link>
          <Link href="/v2/planner" className="btn btn-secondary">
            Today
          </Link>
          <Link
            href={`/v2/planner?date=${addDaysISO(date, 1)}`}
            className="btn btn-secondary"
            aria-label="Next day"
          >
            →
          </Link>
        </div>
      </header>

      <DayPlanner dayPlanId={id} slots={slotsWithFoods} allFoods={allFoods} />
    </main>
  );
}
