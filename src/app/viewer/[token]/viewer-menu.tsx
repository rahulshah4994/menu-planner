"use client";
import { useEffect, useState } from "react";

type Slot = "Breakfast" | "Lunch" | "Evening Snack" | "Dinner";
type Lang = "hi" | "en" | "both";

const SLOTS: Slot[] = ["Breakfast", "Lunch", "Evening Snack", "Dinner"];

const SLOT_LABEL: Record<Slot, { hi: string; en: string }> = {
  Breakfast: { hi: "नाश्ता", en: "Breakfast" },
  Lunch: { hi: "दोपहर का खाना", en: "Lunch" },
  "Evening Snack": { hi: "शाम का नाश्ता", en: "Evening Snack" },
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

function dayLabel(iso: string, idx: number, lang: Lang) {
  const d = new Date(`${iso}T00:00:00`);
  const hiName = DAY_HINDI[d.getDay()];
  const dd = d.getDate();
  const mm = d.toLocaleDateString("en-US", { month: "short" });
  const enWeekday = d.toLocaleDateString("en-US", { weekday: "long" });

  const hi =
    idx === 0 ? "आज" : idx === 1 ? "कल" : `${hiName} · ${dd} ${mm}`;
  const en =
    idx === 0
      ? "Today"
      : idx === 1
      ? "Tomorrow"
      : `${enWeekday} · ${dd} ${mm}`;
  return { hi, en, sub: `${enWeekday}, ${dd} ${mm}` };
}

export function ViewerMenu({
  dates,
  plans,
  householdSize,
}: {
  dates: string[];
  plans: ViewerPlan[];
  householdSize: number;
}) {
  const [lang, setLang] = useState<Lang>("both");

  // Remember the cook's choice on this device.
  useEffect(() => {
    const saved = localStorage.getItem("viewer-lang");
    if (saved === "hi" || saved === "en" || saved === "both") {
      setLang(saved);
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("viewer-lang", lang);
  }, [lang]);

  const byKey = new Map<string, ViewerPlan>();
  for (const p of plans) byKey.set(`${p.date}|${p.slot}`, p);

  const heading =
    lang === "hi"
      ? "आज का मेनू"
      : lang === "en"
      ? "Today's Menu"
      : "आज का मेनू · Today's Menu";

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white px-5 py-6">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-black">
          {heading}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{dates.length} days</p>

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

      <div className="space-y-8">
        {dates.map((iso, idx) => {
          const dl = dayLabel(iso, idx, lang);
          return (
            <section key={iso}>
              <h2 className="text-base font-semibold text-black">
                {lang === "en" ? dl.en : dl.hi}
                {lang !== "en" && (
                  <span className="ml-2 text-xs font-normal text-zinc-400">
                    {dl.sub}
                  </span>
                )}
              </h2>

              <div className="mt-3 space-y-3">
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

  return (
    <div className="border border-zinc-200 p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-black">
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
