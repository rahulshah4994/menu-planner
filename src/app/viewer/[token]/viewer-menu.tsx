"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import {
  addDays,
  formatISODate,
  formatWeekRangeLabel,
  parseISODate,
} from "@/lib/dates";
import { mealTypeColor } from "@/lib/meal-colors";

type Slot = "Breakfast" | "Lunch" | "Dinner";
type Lang = "hi" | "en" | "both";

const SLOTS: Slot[] = ["Breakfast", "Lunch", "Dinner"];

const SLOT_LABEL: Record<Slot, { hi: string; en: string }> = {
  Breakfast: { hi: "नाश्ता", en: "Breakfast" },
  Lunch: { hi: "दोपहर का खाना", en: "Lunch" },
  Dinner: { hi: "रात का खाना", en: "Dinner" },
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

const LANG_LABEL: Record<Lang, string> = {
  hi: "हिन्दी",
  en: "English",
  both: "दोनों · Both",
};

export interface ViewerPlan {
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
}

function dayLabel(iso: string, todayISO: string, tomorrowISO: string) {
  const d = new Date(`${iso}T00:00:00`);
  const hiName = DAY_HINDI[d.getDay()];
  const dd = d.getDate();
  const mm = d.toLocaleDateString("en-US", { month: "short" });
  const enWeekday = d.toLocaleDateString("en-US", { weekday: "long" });

  const isToday = iso === todayISO;
  const isTomorrow = iso === tomorrowISO;
  const hi = isToday ? "आज" : isTomorrow ? "कल" : `${hiName} · ${dd} ${mm}`;
  const en = isToday
    ? "Today"
    : isTomorrow
    ? "Tomorrow"
    : `${enWeekday} · ${dd} ${mm}`;
  return { hi, en, sub: `${enWeekday}, ${dd} ${mm}` };
}

export function ViewerMenu({
  dates,
  plans,
  householdSize,
  todayISO,
  token,
  prevStart,
  nextStart,
}: {
  dates: string[];
  plans: ViewerPlan[];
  householdSize: number;
  todayISO: string;
  token: string;
  prevStart: string;
  nextStart: string;
}) {
  const [lang, setLang] = useState<Lang>("both");

  // Remember the cook's choice on this device.
  useEffect(() => {
    const saved = localStorage.getItem("viewer-lang");
    if (saved === "hi" || saved === "en" || saved === "both") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration-safe read of the saved choice
      setLang(saved);
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("viewer-lang", lang);
  }, [lang]);

  const byKey = new Map<string, ViewerPlan>();
  for (const p of plans) byKey.set(`${p.date}|${p.slot}`, p);

  const tomorrowISO = formatISODate(addDays(parseISODate(todayISO), 1));
  const isCurrent = dates[0] === todayISO;
  const rangeLabel = formatWeekRangeLabel(parseISODate(dates[0]), dates.length);

  const heading =
    lang === "hi" ? "मेनू" : lang === "en" ? "Menu" : "मेनू · Menu";
  const backToToday =
    lang === "hi"
      ? "आज पर लौटें"
      : lang === "en"
      ? "Back to today"
      : "आज पर लौटें · Back to today";

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-white px-5 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-black">
          {heading}
        </h1>

        {/* Previous / range / next */}
        <div className="mt-3 flex max-w-sm items-center gap-2">
          <Link
            href={`/viewer/${token}?start=${prevStart}`}
            aria-label="Previous days"
            className="rounded-md border border-zinc-300 p-2 text-zinc-600 hover:border-black hover:text-black"
          >
            <CaretLeft size={16} weight="bold" />
          </Link>
          <span className="flex-1 text-center text-sm font-medium text-zinc-700">
            {rangeLabel}
          </span>
          <Link
            href={`/viewer/${token}?start=${nextStart}`}
            aria-label="Next days"
            className="rounded-md border border-zinc-300 p-2 text-zinc-600 hover:border-black hover:text-black"
          >
            <CaretRight size={16} weight="bold" />
          </Link>
        </div>
        {!isCurrent && (
          <div className="mt-2 max-w-sm text-center">
            <Link
              href={`/viewer/${token}`}
              className="text-xs font-medium text-black underline"
            >
              {backToToday}
            </Link>
          </div>
        )}

        {/* Language toggle */}
        <div className="mt-4 inline-flex rounded-lg border border-zinc-300 p-0.5">
          {(["hi", "en", "both"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                lang === l
                  ? "bg-black text-white"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              {LANG_LABEL[l]}
            </button>
          ))}
        </div>
      </header>

      {/* Day-wise calendar columns — swipe sideways for more days. */}
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto p-1 pb-4">
        {dates.map((iso) => {
          const dl = dayLabel(iso, todayISO, tomorrowISO);
          const isToday = iso === todayISO;
          return (
            <section
              key={iso}
              className={`flex w-72 shrink-0 snap-start flex-col rounded-xl p-3 ${
                isToday ? "bg-emerald-50 ring-2 ring-emerald-400" : ""
              }`}
            >
              <h2
                className={`text-2xl font-bold tracking-tight ${
                  isToday ? "text-emerald-800" : "text-black"
                }`}
              >
                {lang === "en" ? dl.en : dl.hi}
              </h2>
              {lang !== "en" && (
                <p className="mt-0.5 text-sm text-zinc-400">{dl.sub}</p>
              )}

              <div className="mt-3 flex flex-col gap-3">
                {SLOTS.map((slot) => {
                  const p = byKey.get(`${iso}|${slot}`);
                  return (
                    <SlotBlock
                      key={slot}
                      slot={slot}
                      plan={p}
                      lang={lang}
                      householdSize={householdSize}
                    />
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

function SlotBlock({
  slot,
  plan,
  lang,
  householdSize,
}: {
  slot: Slot;
  plan: ViewerPlan | undefined;
  lang: Lang;
  householdSize: number;
}) {
  const label = SLOT_LABEL[slot];
  const meals = (plan?.meal_plan_meals ?? []).sort(
    (a, b) => a.position - b.position
  );
  const addons = plan?.meal_plan_addons ?? [];
  const empty = !plan || (meals.length === 0 && !plan.eating_out);
  const c = mealTypeColor(slot);

  return (
    <div className={`border p-4 ${c.bg} ${c.border}`}>
      <div className="flex items-baseline justify-between">
        <h3 className={`text-sm font-semibold ${c.heading}`}>
          {lang === "en" ? label.en : label.hi}
        </h3>
        {lang === "both" && (
          <span className="text-[11px] uppercase tracking-wider text-zinc-400">
            {label.en}
          </span>
        )}
      </div>

      {empty ? (
        <p className="mt-2 text-sm text-zinc-400">
          {lang === "en"
            ? "— nothing planned —"
            : "— कुछ नहीं चुना —"}
        </p>
      ) : plan!.eating_out ? (
        <p className="mt-2 text-sm text-zinc-600">
          🍽{" "}
          {lang === "hi"
            ? "बाहर खाना"
            : lang === "en"
            ? "Eating out"
            : "बाहर खाना (Eating out)"}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {meals.map((mm) => (
            <div
              key={mm.meal.id}
              className="border-l-2 border-black pl-3"
            >
              <Bilingual
                hi={mm.meal.name_hi}
                en={mm.meal.name_en}
                lang={lang}
                primaryClass="text-base font-medium text-black"
                secondaryClass="text-xs text-zinc-500"
              />
              {(mm.meal.meal_dishes ?? [])
                .sort((a, b) => a.position - b.position)
                .map((md) => (
                  <DishLine key={md.dish.id} dish={md.dish} lang={lang} />
                ))}
            </div>
          ))}
        </div>
      )}

      {plan && !plan.eating_out && addons.length > 0 && (
        <div className="mt-3 border-t border-zinc-100 pt-3">
          <p className="text-[11px] uppercase tracking-wider text-zinc-400">
            {lang === "en" ? "Sides & extras" : "साथ में"}
          </p>
          <ul className="mt-1 space-y-1 text-sm">
            {addons.map((a) => (
              <li key={a.dish.id}>
                <Bilingual
                  hi={a.dish.name_hi}
                  en={a.dish.name_en}
                  lang={lang}
                  inline
                  primaryClass="font-medium text-zinc-800"
                  secondaryClass="text-xs text-zinc-400"
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan && (plan.guests > 0 || plan.today_note) && (
        <div className="mt-3 border-t border-zinc-100 pt-3 text-sm">
          {plan.guests > 0 && (
            <p className="text-zinc-700">
              👥 {householdSize} + {plan.guests}{" "}
              {lang === "en" ? "guests" : "मेहमान"}
            </p>
          )}
          {plan.today_note && (
            <p className="mt-1 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-zinc-800">
              📝 {plan.today_note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DishLine({
  dish,
  lang,
}: {
  dish: {
    name_en: string;
    name_hi: string;
    ingredients: string;
    ingredients_hi: string;
    recipe_url: string | null;
  };
  lang: Lang;
}) {
  const ingHi = dish.ingredients_hi || dish.ingredients;
  const ingEn = dish.ingredients || dish.ingredients_hi;
  const showBothIng =
    lang === "both" && ingHi && ingEn && ingHi !== ingEn;

  return (
    <div className="mt-2 text-sm">
      <p className="font-medium text-zinc-800">
        •{" "}
        {lang === "en" ? dish.name_en : dish.name_hi}
        {lang === "both" && (
          <span className="text-xs text-zinc-400"> ({dish.name_en})</span>
        )}
      </p>
      {(lang === "en" ? ingEn : ingHi) && (
        <p className="ml-3 text-xs text-zinc-500">
          {lang === "en" ? ingEn : ingHi}
        </p>
      )}
      {showBothIng && (
        <p className="ml-3 text-xs text-zinc-400">{ingEn}</p>
      )}
      {dish.recipe_url && (
        <a
          href={dish.recipe_url}
          target="_blank"
          rel="noreferrer"
          className="ml-3 text-xs text-black underline"
        >
          recipe ↗
        </a>
      )}
    </div>
  );
}

function Bilingual({
  hi,
  en,
  lang,
  primaryClass,
  secondaryClass,
  inline,
}: {
  hi: string;
  en: string;
  lang: Lang;
  primaryClass: string;
  secondaryClass: string;
  inline?: boolean;
}) {
  if (lang === "hi") return <p className={primaryClass}>{hi}</p>;
  if (lang === "en") return <p className={primaryClass}>{en}</p>;
  if (inline) {
    return (
      <span>
        <span className={primaryClass}>{hi}</span>
        <span className={`ml-1 ${secondaryClass}`}>({en})</span>
      </span>
    );
  }
  return (
    <>
      <p className={primaryClass}>{hi}</p>
      <p className={secondaryClass}>{en}</p>
    </>
  );
}
