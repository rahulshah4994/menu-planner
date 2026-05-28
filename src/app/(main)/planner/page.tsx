import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import {
  addDays,
  formatISODate,
  formatWeekRangeLabel,
  parseISODate,
  rangeDays,
} from "@/lib/dates";
import { dayPlanId, slotId } from "@/lib/v2/ids";
import type {
  DaySlot,
  FoodLite,
  SlotTemplate,
  SlotWithFoods,
} from "@/lib/v2/types";
import { PlannerBoard, type PlannerDay } from "./planner-board";

export const dynamic = "force-dynamic";

export default async function V2PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const { start } = await searchParams;
  const settings = await getSettings();
  const horizon = settings.planning_horizon_days;

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const todayISO = formatISODate(todayDate);
  const startDate = start && /^\d{4}-\d{2}-\d{2}$/.test(start)
    ? parseISODate(start)
    : todayDate;
  const startISO = formatISODate(startDate);
  const prevStart = formatISODate(addDays(startDate, -horizon));
  const nextStart = formatISODate(addDays(startDate, horizon));
  const dates = rangeDays(startDate, horizon).map((d) => formatISODate(d));
  const planIds = dates.map((d) => dayPlanId(d));

  const supabase = await createClient();

  // Ensure a day_plan row exists for each visible day.
  await supabase
    .from("day_plans")
    .upsert(
      dates.map((d, i) => ({ id: planIds[i], plan_date: d })),
      { onConflict: "id" }
    );

  // Load slots for the range.
  let { data: slotData } = await supabase
    .from("day_slots")
    .select("*")
    .in("day_plan_id", planIds)
    .order("position");
  let slots = (slotData ?? []) as DaySlot[];

  // Seed templates for any unplanned days.
  const planned = new Set(slots.map((s) => s.day_plan_id));
  const toSeed = planIds.filter((pid) => !planned.has(pid));
  if (toSeed.length) {
    const { data: tplData } = await supabase
      .from("slot_templates")
      .select("*")
      .order("position");
    const templates = (tplData ?? []) as SlotTemplate[];
    if (templates.length) {
      const inserts = toSeed.flatMap((pid) =>
        templates.map((t, i) => ({
          id: slotId(pid, i + 1),
          day_plan_id: pid,
          slot_no: i + 1,
          name: t.name,
          color: t.color,
          position: i + 1,
        }))
      );
      await supabase.from("day_slots").insert(inserts);
      const refetch = await supabase
        .from("day_slots")
        .select("*")
        .in("day_plan_id", planIds)
        .order("position");
      slots = (refetch.data ?? []) as DaySlot[];
    }
  }

  // Fetch foods placed in those slots.
  const slotIds = slots.map((s) => s.id);
  const foodsBySlot = new Map<number, FoodLite[]>();
  if (slotIds.length) {
    const { data: sf } = await supabase
      .from("day_slot_foods")
      .select(
        "day_slot_id, position, food:foods(id,name,name_hi,categories)"
      )
      .in("day_slot_id", slotIds)
      .order("position");
    for (const row of (sf ?? []) as unknown as {
      day_slot_id: number;
      food: FoodLite | null;
    }[]) {
      if (!row.food) continue;
      const arr = foodsBySlot.get(row.day_slot_id) ?? [];
      arr.push(row.food);
      foodsBySlot.set(row.day_slot_id, arr);
    }
  }

  const slotsByPlan = new Map<number, SlotWithFoods[]>();
  for (const s of slots) {
    const arr = slotsByPlan.get(s.day_plan_id) ?? [];
    arr.push({ ...s, foods: foodsBySlot.get(s.id) ?? [] });
    slotsByPlan.set(s.day_plan_id, arr);
  }

  const days: PlannerDay[] = dates.map((date) => ({
    date,
    planId: dayPlanId(date),
    slots: slotsByPlan.get(dayPlanId(date)) ?? [],
  }));

  // Catalog for the picker.
  const { data: foodData } = await supabase
    .from("foods")
    .select("id,name,name_hi,categories")
    .eq("active", true)
    .order("name");
  const allFoods = (foodData ?? []) as FoodLite[];

  return (
    <main>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8 sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl">
            Planner
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {formatWeekRangeLabel(startDate, horizon)} · {horizon} days
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Link
            href={`/planner?start=${prevStart}`}
            className="btn btn-secondary"
            aria-label={`Previous ${horizon} days`}
          >
            <CaretLeft size={16} weight="bold" />
          </Link>
          <Link href="/planner" className="btn btn-secondary">
            Today
          </Link>
          <Link
            href={`/planner?start=${nextStart}`}
            className="btn btn-secondary"
            aria-label={`Next ${horizon} days`}
          >
            <CaretRight size={16} weight="bold" />
          </Link>
        </div>
      </header>

      <PlannerBoard
        days={days}
        todayISO={todayISO}
        allFoods={allFoods}
        rangeStart={startISO}
        rangeDays={horizon}
        defaultPeople={settings.household_size}
      />
    </main>
  );
}
