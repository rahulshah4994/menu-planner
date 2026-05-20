import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { RandomiseButton } from "./submit-button";
import { createClient } from "@/lib/supabase/server";
import {
  addDays,
  formatISODate,
  formatWeekRangeLabel,
  parseISODate,
  rangeDays,
} from "@/lib/dates";
import { getSettings } from "@/lib/settings";
import { randomiseRange } from "./actions";
import { PlannerBoard } from "./planner-board";
import {
  SLOTS,
  type AddonCategory,
  type AddonLite,
  type MealLite,
  type PlanState,
  type Slot,
} from "./types";

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const { start } = await searchParams;
  const settings = await getSettings();
  const days = settings.planning_horizon_days;

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const todayISO = formatISODate(todayDate);
  const startDate = start ? parseISODate(start) : todayDate;
  const startISO = formatISODate(startDate);
  const endISO = formatISODate(addDays(startDate, days));
  const prevStart = formatISODate(addDays(startDate, -days));
  const nextStart = formatISODate(addDays(startDate, days));

  const supabase = await createClient();
  const [plansResult, mealsResult, addonsResult] = await Promise.all([
    supabase
      .from("meal_plans")
      .select(
        `id, date, slot, eating_out, guests, today_note,
         meal_plan_meals (
           meal_id, position,
           meal:meals (id, name_en, name_hi)
         ),
         meal_plan_addons (
           dish_id,
           dish:dishes (id, name_en, name_hi, category)
         )`
      )
      .gte("date", startISO)
      .lt("date", endISO),
    supabase
      .from("meals")
      .select("id, name_en, name_hi, meal_type")
      .eq("active", true)
      .order("name_en"),
    supabase
      .from("dishes")
      .select("id, name_en, name_hi, category")
      .in("category", ["Beverage", "Side", "Salad", "Dessert"])
      .eq("active", true)
      .order("name_en"),
  ]);

  type PlanRow = {
    id: string;
    date: string;
    slot: Slot;
    eating_out: boolean;
    guests: number;
    today_note: string | null;
    meal_plan_meals?: {
      meal_id: string;
      position: number;
      meal: { id: string; name_en: string; name_hi: string };
    }[];
    meal_plan_addons?: {
      dish_id: string;
      dish: {
        id: string;
        name_en: string;
        name_hi: string;
        category: AddonCategory;
      };
    }[];
  };

  const byKey = new Map<string, PlanRow>();
  for (const p of (plansResult.data ?? []) as unknown as PlanRow[]) {
    byKey.set(`${p.date}|${p.slot}`, p);
  }

  const dates = rangeDays(startDate, days).map((d) => formatISODate(d));

  // One PlanState per date|slot — empty default where no row exists.
  const slotPlans: Record<string, PlanState> = {};
  for (const iso of dates) {
    for (const slot of SLOTS) {
      const row = byKey.get(`${iso}|${slot}`);
      slotPlans[`${iso}|${slot}`] = {
        meals: (row?.meal_plan_meals ?? [])
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((mm) => ({
            id: mm.meal.id,
            name_en: mm.meal.name_en,
            name_hi: mm.meal.name_hi,
          })),
        addons: (row?.meal_plan_addons ?? []).map((ma) => ({
          id: ma.dish.id,
          name_en: ma.dish.name_en,
          name_hi: ma.dish.name_hi,
          category: ma.dish.category,
        })),
        eating_out: row?.eating_out ?? false,
        guests: row?.guests ?? 0,
        today_note: row?.today_note ?? null,
      };
    }
  }

  // Meals available per slot — Lunch & Dinner share a pool.
  const mealsByType: Record<Slot, MealLite[]> = {
    Breakfast: [],
    Lunch: [],
    Dinner: [],
  };
  for (const m of (mealsResult.data ?? []) as unknown as {
    id: string;
    name_en: string;
    name_hi: string;
    meal_type: Slot;
  }[]) {
    const lite = { id: m.id, name_en: m.name_en, name_hi: m.name_hi };
    if (m.meal_type === "Lunch" || m.meal_type === "Dinner") {
      mealsByType.Lunch.push(lite);
      mealsByType.Dinner.push(lite);
    } else {
      mealsByType[m.meal_type].push(lite);
    }
  }

  const addonsByCategory: Record<AddonCategory, AddonLite[]> = {
    Beverage: [],
    Side: [],
    Salad: [],
    Dessert: [],
  };
  for (const d of (addonsResult.data ?? []) as unknown as AddonLite[]) {
    addonsByCategory[d.category].push(d);
  }

  return (
    <main>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8 sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-black sm:text-3xl">
            Planner
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {formatWeekRangeLabel(startDate, days)} · {days} days
          </p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Link
            href={`/planner?start=${prevStart}`}
            className="btn btn-secondary"
            aria-label={`Previous ${days} days`}
          >
            <CaretLeft size={16} weight="bold" />
          </Link>
          <Link href="/planner" className="btn btn-secondary">
            Today
          </Link>
          <Link
            href={`/planner?start=${nextStart}`}
            className="btn btn-secondary"
            aria-label={`Next ${days} days`}
          >
            <CaretRight size={16} weight="bold" />
          </Link>
          <form
            action={randomiseRange.bind(null, startISO, days)}
            className="ml-auto sm:ml-0"
          >
            <RandomiseButton className="btn btn-primary">
              <span className="hidden sm:inline">Randomise empty slots</span>
              <span className="sm:hidden">Randomise</span>
            </RandomiseButton>
          </form>
        </div>
      </header>

      <PlannerBoard
        dates={dates}
        todayISO={todayISO}
        slotPlans={slotPlans}
        mealsByType={mealsByType}
        addonsByCategory={addonsByCategory}
      />
    </main>
  );
}
