import Link from "next/link";
import { CaretLeft, CaretRight, Shuffle } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import {
  addDays,
  formatDayLabel,
  formatISODate,
  formatWeekRangeLabel,
  parseISODate,
  rangeDays,
} from "@/lib/dates";
import { getSettings } from "@/lib/settings";
import { SlotCard } from "./slot-card";
import { randomiseDay, randomiseRange } from "./actions";

type Slot = "Breakfast" | "Lunch" | "Evening Snack" | "Dinner";
const SLOTS: Slot[] = ["Breakfast", "Lunch", "Evening Snack", "Dinner"];
const ADDON_CATEGORIES = ["Beverage", "Side", "Salad", "Dessert"] as const;

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
  const endDate = addDays(startDate, days);
  const endISO = formatISODate(endDate);

  const prevStart = formatISODate(addDays(startDate, -days));
  const nextStart = formatISODate(addDays(startDate, days));

  const supabase = await createClient();

  // Run the 3 reads in parallel
  const [plansResult, mealsResult, addonsResult] = await Promise.all([
    supabase
      .from("meal_plans")
      .select(
        `id, date, slot, eating_out, guests, today_note,
         meal_plan_meals (
           meal_id, position,
           meal:meals (id, name_en, name_hi, meal_type)
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
  const plansData = plansResult.data;
  const allMealsData = mealsResult.data;
  const addonsData = addonsResult.data;

  // Lookup table keyed by `${date}|${slot}`
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
        category: "Beverage" | "Side" | "Salad" | "Dessert";
      };
    }[];
  };
  const byKey = new Map<string, PlanRow>();
  for (const p of (plansData ?? []) as unknown as PlanRow[]) {
    byKey.set(`${p.date}|${p.slot}`, p);
  }

  const mealsByType: Record<Slot, { id: string; name_en: string; name_hi: string }[]> = {
    Breakfast: [],
    Lunch: [],
    "Evening Snack": [],
    Dinner: [],
  };
  for (const m of (allMealsData ?? []) as unknown as {
    id: string;
    name_en: string;
    name_hi: string;
    meal_type: Slot;
  }[]) {
    mealsByType[m.meal_type].push({
      id: m.id,
      name_en: m.name_en,
      name_hi: m.name_hi,
    });
  }

  const addonsByCategory: Record<
    "Beverage" | "Side" | "Salad" | "Dessert",
    { id: string; name_en: string; name_hi: string; category: "Beverage" | "Side" | "Salad" | "Dessert" }[]
  > = { Beverage: [], Side: [], Salad: [], Dessert: [] };
  for (const d of (addonsData ?? []) as unknown as {
    id: string;
    name_en: string;
    name_hi: string;
    category: "Beverage" | "Side" | "Salad" | "Dessert";
  }[]) {
    addonsByCategory[d.category].push(d);
  }

  const dates = rangeDays(startDate, days);

  return (
    <main>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-black">
            Planner
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {formatWeekRangeLabel(startDate, days)} · {days} days
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <form action={randomiseRange.bind(null, startISO, days)}>
            <button type="submit" className="btn btn-primary">
              <Shuffle size={16} weight="bold" />
              Randomise empty slots
            </button>
          </form>
        </div>
      </header>

      <div className="space-y-6">
        {dates.map((d) => {
          const iso = formatISODate(d);
          const isToday = iso === todayISO;
          return (
            <section
              key={iso}
              className={`overflow-hidden rounded-lg border bg-white ${
                isToday ? "border-black" : "border-zinc-200"
              }`}
            >
              <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-5 py-3">
                <h2 className="flex items-baseline gap-2 text-base font-semibold text-black">
                  {formatDayLabel(d)}
                  {isToday && (
                    <span className="rounded-md bg-black px-2 py-0.5 text-xs font-medium text-white">
                      Today
                    </span>
                  )}
                </h2>
                <form action={randomiseDay.bind(null, iso)}>
                  <button type="submit" className="btn btn-secondary">
                    <Shuffle size={14} weight="bold" />
                    Randomise day
                  </button>
                </form>
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2">
                {SLOTS.map((slot) => {
                  const row = byKey.get(`${iso}|${slot}`);
                  const plan = {
                    meals:
                      row?.meal_plan_meals
                        ?.sort((a, b) => a.position - b.position)
                        .map((mm) => ({
                          id: mm.meal.id,
                          name_en: mm.meal.name_en,
                          name_hi: mm.meal.name_hi,
                        })) ?? [],
                    addons:
                      row?.meal_plan_addons?.map((ma) => ({
                        id: ma.dish.id,
                        name_en: ma.dish.name_en,
                        name_hi: ma.dish.name_hi,
                        category: ma.dish.category,
                      })) ?? [],
                    eating_out: row?.eating_out ?? false,
                    guests: row?.guests ?? 0,
                    today_note: row?.today_note ?? null,
                  };
                  return (
                    <SlotCard
                      key={slot}
                      date={iso}
                      slot={slot}
                      plan={plan}
                      availableMeals={mealsByType[slot]}
                      availableAddons={addonsByCategory}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
