"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CaretLeft,
  CaretRight,
  ForkKnife,
  NotePencil,
  Rows,
  SquaresFour,
  Users,
} from "@phosphor-icons/react/dist/ssr";
import {
  addDays,
  formatISODate,
  formatWeekRangeLabel,
  parseISODate,
} from "@/lib/dates";

type Lang = "hi" | "en" | "both";
type Layout = "horizontal" | "vertical";

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

export interface ViewerFood {
  id: string;
  name: string;
  name_hi: string;
  ingredients: string;
  ingredients_hi: string;
  recipe_url: string | null;
}

export interface ViewerSlot {
  id: number;
  name: string;
  color: string;
  position: number;
  people_eating: number | null;
  notes: string;
  eating_out: boolean;
  foods: ViewerFood[];
}

export interface ViewerDay {
  date: string;
  slots: ViewerSlot[];
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

function hexAlpha(hex: string, alpha: number) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ViewerMenu({
  dates,
  days,
  todayISO,
  token,
  prevStart,
  nextStart,
  defaultPeople,
}: {
  dates: string[];
  days: ViewerDay[];
  todayISO: string;
  token: string;
  prevStart: string;
  nextStart: string;
  defaultPeople: number;
}) {
  const [lang, setLang] = useState<Lang>("both");
  const [layout, setLayout] = useState<Layout>("vertical");

  useEffect(() => {
    const saved = localStorage.getItem("viewer-lang");
    if (saved === "hi" || saved === "en" || saved === "both") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration-safe read of the saved choice
      setLang(saved);
    }
    const savedLayout = localStorage.getItem("viewer-layout");
    // Phones default to vertical; larger screens default to horizontal.
    const nextLayout: Layout =
      savedLayout === "horizontal" || savedLayout === "vertical"
        ? savedLayout
        : typeof window !== "undefined" &&
          window.matchMedia("(min-width: 768px)").matches
        ? "horizontal"
        : "vertical";
    setLayout(nextLayout);
  }, []);
  useEffect(() => {
    localStorage.setItem("viewer-lang", lang);
  }, [lang]);
  useEffect(() => {
    localStorage.setItem("viewer-layout", layout);
  }, [layout]);

  const byDate = new Map<string, ViewerDay>();
  for (const d of days) byDate.set(d.date, d);

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

        <div className="mt-3 flex max-w-sm items-center gap-2">
          <Link
            href={`/v2/viewer/${token}?start=${prevStart}`}
            aria-label="Previous days"
            className="rounded-md border border-zinc-300 p-2 text-zinc-600 hover:border-black hover:text-black"
          >
            <CaretLeft size={16} weight="bold" />
          </Link>
          <span className="flex-1 text-center text-sm font-medium text-zinc-700">
            {rangeLabel}
          </span>
          <Link
            href={`/v2/viewer/${token}?start=${nextStart}`}
            aria-label="Next days"
            className="rounded-md border border-zinc-300 p-2 text-zinc-600 hover:border-black hover:text-black"
          >
            <CaretRight size={16} weight="bold" />
          </Link>
        </div>
        {!isCurrent && (
          <div className="mt-2 max-w-sm text-center">
            <Link
              href={`/v2/viewer/${token}`}
              className="text-xs font-medium text-black underline"
            >
              {backToToday}
            </Link>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-zinc-300 p-0.5">
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
          <div className="inline-flex rounded-lg border border-zinc-300 p-0.5">
            <button
              type="button"
              onClick={() => setLayout("vertical")}
              aria-label="Stack days vertically"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                layout === "vertical"
                  ? "bg-black text-white"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              <Rows size={14} weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => setLayout("horizontal")}
              aria-label="Scroll days horizontally"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                layout === "horizontal"
                  ? "bg-black text-white"
                  : "text-zinc-600 hover:text-black"
              }`}
            >
              <SquaresFour size={14} weight="bold" />
            </button>
          </div>
        </div>
      </header>

      <div
        className={
          layout === "horizontal"
            ? "flex snap-x snap-mandatory gap-2 overflow-x-auto p-1 pb-4"
            : "flex flex-col gap-3 p-1 pb-4"
        }
      >
        {dates.map((iso) => {
          const dl = dayLabel(iso, todayISO, tomorrowISO);
          const isToday = iso === todayISO;
          const day = byDate.get(iso);
          const slots = day?.slots ?? [];
          return (
            <section
              key={iso}
              className={`flex flex-col rounded-xl p-3 ${
                layout === "horizontal"
                  ? "w-72 shrink-0 snap-start"
                  : "w-full"
              } ${isToday ? "bg-emerald-50 ring-2 ring-emerald-400" : ""}`}
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
                {slots.map((s) => (
                  <SlotBlock
                    key={s.id}
                    slot={s}
                    lang={lang}
                    defaultPeople={defaultPeople}
                  />
                ))}
                {slots.length === 0 && (
                  <p className="text-sm text-zinc-400">
                    {lang === "en"
                      ? "— nothing planned —"
                      : "— कुछ नहीं चुना —"}
                  </p>
                )}
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
  lang,
  defaultPeople,
}: {
  slot: ViewerSlot;
  lang: Lang;
  defaultPeople: number;
}) {
  const bg = hexAlpha(slot.color, 0.18);
  const border = hexAlpha(slot.color, 0.55);
  const empty = slot.foods.length === 0;
  const peopleCount = slot.people_eating ?? defaultPeople;
  const peopleOverride =
    slot.people_eating !== null && slot.people_eating !== defaultPeople;

  return (
    <div
      className="border p-4"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-800">{slot.name}</h3>
        {!peopleOverride && (
          <span
            className="inline-flex items-center gap-1 rounded bg-white/60 px-2 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-300"
            title={lang === "hi" ? "खाने वाले" : "People eating"}
          >
            <Users size={12} weight="bold" />
            {peopleCount}
          </span>
        )}
      </div>

      {peopleOverride && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border-2 border-amber-500 bg-amber-100 px-2 py-1 text-sm font-semibold text-amber-900">
          <Users size={15} weight="bold" />
          {lang === "en"
            ? `${slot.people_eating} eating (default ${defaultPeople})`
            : lang === "hi"
            ? `${slot.people_eating} खाने वाले (सामान्य ${defaultPeople})`
            : `${slot.people_eating} खाने वाले · eating (default ${defaultPeople})`}
        </div>
      )}

      {slot.eating_out ? (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-sm font-medium text-amber-900 ring-1 ring-amber-300">
          <ForkKnife size={14} weight="bold" />
          {lang === "hi"
            ? "बाहर खाना"
            : lang === "en"
            ? "Eating out"
            : "बाहर खाना · Eating out"}
        </p>
      ) : empty ? (
        <p className="mt-2 text-sm text-zinc-400">
          {lang === "en" ? "— nothing planned —" : "— कुछ नहीं चुना —"}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {slot.foods.map((f) => (
            <FoodLine key={f.id} food={f} lang={lang} />
          ))}
        </div>
      )}

      {slot.notes && (
        <p className="mt-3 flex items-start gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2 py-1.5 text-sm text-zinc-800">
          <NotePencil
            size={14}
            weight="bold"
            className="mt-0.5 shrink-0 text-amber-700"
          />
          <span>{slot.notes}</span>
        </p>
      )}
    </div>
  );
}

function FoodLine({ food, lang }: { food: ViewerFood; lang: Lang }) {
  const ingHi = food.ingredients_hi || food.ingredients;
  const ingEn = food.ingredients || food.ingredients_hi;
  const showBothIng = lang === "both" && ingHi && ingEn && ingHi !== ingEn;

  return (
    <div className="text-sm">
      <p className="font-medium text-zinc-800">
        • {lang === "en" ? food.name : food.name_hi || food.name}
        {lang === "both" && food.name && food.name_hi && (
          <span className="text-xs text-zinc-400"> ({food.name})</span>
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
      {food.recipe_url && (
        <a
          href={food.recipe_url}
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
