import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import {
  addDays,
  formatISODate,
  rangeDays,
} from "@/lib/dates";

type Slot = "Breakfast" | "Lunch" | "Evening Snack" | "Dinner";
const SLOTS: Slot[] = ["Breakfast", "Lunch", "Evening Snack", "Dinner"];

const SLOT_HINDI: Record<Slot, string> = {
  Breakfast: "नाश्ता",
  Lunch: "दोपहर का खाना",
  "Evening Snack": "शाम का नाश्ता",
  Dinner: "रात का खाना",
};

const DAY_HINDI = [
  "रविवार",
  "सोमवार",
  "मंगलवार",
  "बुधवार",
  "गुरुवार",
  "शुक्रवार",
  "शनिवार",
];

function hindiDayLabel(d: Date) {
  const dayName = DAY_HINDI[d.getDay()];
  const dd = d.getDate();
  const mm = d.toLocaleDateString("en-US", { month: "short" });
  return `${dayName} · ${dd} ${mm}`;
}

export const dynamic = "force-dynamic";

export default async function ViewerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Validate token with service client (bypasses RLS)
  const supabase = createServiceClient();
  const { data: tokenRow } = await supabase
    .from("cook_tokens")
    .select("token, revoked")
    .eq("token", token)
    .maybeSingle();
  if (!tokenRow || tokenRow.revoked) notFound();

  const settings = await getSettings().catch(async () => {
    // settings table is RLS-protected; fall back via service client
    const { data } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();
    return data!;
  });

  const days = settings.viewer_horizon_days ?? 3;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startISO = formatISODate(today);
  const endISO = formatISODate(addDays(today, days));

  const { data: plansData } = await supabase
    .from("meal_plans")
    .select(
      `id, date, slot, eating_out, guests, today_note,
       meal_plan_meals (
         meal_id, position,
         meal:meals (
           id, name_en, name_hi,
           meal_dishes (
             position,
             dish:dishes (id, name_en, name_hi, ingredients, ingredients_hi, recipe_url)
           )
         )
       ),
       meal_plan_addons (
         dish_id,
         dish:dishes (id, name_en, name_hi, ingredients, ingredients_hi, recipe_url, category)
       )`
    )
    .gte("date", startISO)
    .lt("date", endISO)
    .order("date", { ascending: true });

  type ViewerPlan = {
    date: string;
    slot: Slot;
    eating_out: boolean;
    guests: number;
    today_note: string | null;
    meal_plan_meals?: {
      position: number;
      meal: {
        id: string;
        name_en: string;
        name_hi: string;
        meal_dishes?: {
          position: number;
          dish: {
            id: string;
            name_en: string;
            name_hi: string;
            ingredients: string;
            ingredients_hi: string;
            recipe_url: string | null;
          };
        }[];
      };
    }[];
    meal_plan_addons?: {
      dish: {
        id: string;
        name_en: string;
        name_hi: string;
        ingredients: string;
        ingredients_hi: string;
        recipe_url: string | null;
        category: string;
      };
    }[];
  };

  const plans = (plansData ?? []) as unknown as ViewerPlan[];
  const byKey = new Map<string, ViewerPlan>();
  for (const p of plans) byKey.set(`${p.date}|${p.slot}`, p);

  const dates = rangeDays(today, days);

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white px-5 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-black">
          आज का मेनू
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Today&apos;s menu · {dates.length} days
        </p>
      </header>

      <div className="space-y-8">
        {dates.map((d, idx) => {
          const iso = formatISODate(d);
          return (
            <section key={iso}>
              <h2 className="text-base font-semibold text-black">
                {idx === 0 ? "आज" : idx === 1 ? "कल" : hindiDayLabel(d)}
                <span className="ml-2 text-xs font-normal text-zinc-400">
                  {d.toLocaleDateString("en-US", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </h2>

              <div className="mt-3 space-y-3">
                {SLOTS.map((slot) => {
                  const p = byKey.get(`${iso}|${slot}`);
                  return (
                    <div
                      key={slot}
                      className="border border-zinc-200 p-4"
                    >
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-sm font-semibold text-black">
                          {SLOT_HINDI[slot]}
                        </h3>
                        <span className="text-[11px] uppercase tracking-wider text-zinc-400">
                          {slot}
                        </span>
                      </div>

                      {!p ||
                      (!p.meal_plan_meals?.length &&
                        !p.eating_out) ? (
                        <p className="mt-2 text-sm text-zinc-400">
                          — कुछ नहीं चुना —
                        </p>
                      ) : p.eating_out ? (
                        <p className="mt-2 text-sm text-zinc-600">
                          🍽 बाहर खाना (Eating out)
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {(p.meal_plan_meals ?? [])
                            .sort((a, b) => a.position - b.position)
                            .map((mm) => (
                              <div
                                key={mm.meal.id}
                                className="border-l-2 border-black pl-3"
                              >
                                <p className="text-base font-medium text-black">
                                  {mm.meal.name_hi}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {mm.meal.name_en}
                                </p>
                                {(mm.meal.meal_dishes ?? [])
                                  .sort(
                                    (a, b) => a.position - b.position
                                  )
                                  .map((md) => (
                                    <div
                                      key={md.dish.id}
                                      className="mt-2 text-sm"
                                    >
                                      <p className="font-medium text-zinc-800">
                                        • {md.dish.name_hi}{" "}
                                        <span className="text-xs text-zinc-400">
                                          ({md.dish.name_en})
                                        </span>
                                      </p>
                                      {(md.dish.ingredients_hi ||
                                        md.dish.ingredients) && (
                                        <p className="ml-3 text-xs text-zinc-500">
                                          {md.dish.ingredients_hi ||
                                            md.dish.ingredients}
                                        </p>
                                      )}
                                      {md.dish.recipe_url && (
                                        <a
                                          href={md.dish.recipe_url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="ml-3 text-xs text-black underline"
                                        >
                                          recipe ↗
                                        </a>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            ))}
                        </div>
                      )}

                      {p && !p.eating_out && (p.meal_plan_addons?.length ?? 0) > 0 && (
                        <div className="mt-3 border-t border-zinc-100 pt-3">
                          <p className="text-[11px] uppercase tracking-wider text-zinc-400">
                            साथ में
                          </p>
                          <ul className="mt-1 space-y-1 text-sm">
                            {p.meal_plan_addons!.map((a) => (
                              <li key={a.dish.id}>
                                <span className="font-medium text-zinc-800">
                                  {a.dish.name_hi}
                                </span>
                                <span className="ml-1 text-xs text-zinc-400">
                                  ({a.dish.name_en})
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {p && (p.guests > 0 || p.today_note) && (
                        <div className="mt-3 border-t border-zinc-100 pt-3 text-sm">
                          {p.guests > 0 && (
                            <p className="text-zinc-700">
                              👥 {settings.household_size} + {p.guests} मेहमान
                            </p>
                          )}
                          {p.today_note && (
                            <p className="mt-1 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-zinc-800">
                              📝 {p.today_note}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="mt-12 border-t border-zinc-200 pt-4 text-xs text-zinc-400">
        Menu Planner · read-only view
      </footer>
    </main>
  );
}
