import type { MealType } from "@/lib/db/types";

/**
 * Per-meal-type colour hues for intuitive viewing. The whole slot card /
 * block is tinted with `bg` + `border`; `badge` is for small pills and
 * `heading` for the slot title text.
 */
export interface MealTypeColor {
  bg: string;
  border: string;
  badge: string;
  heading: string;
}

const COLORS: Record<MealType, MealTypeColor> = {
  Breakfast: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-800",
    heading: "text-amber-800",
  },
  Lunch: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    badge: "bg-sky-100 text-sky-800",
    heading: "text-sky-800",
  },
  Dinner: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    badge: "bg-indigo-100 text-indigo-800",
    heading: "text-indigo-800",
  },
};

const FALLBACK: MealTypeColor = {
  bg: "bg-zinc-50",
  border: "border-zinc-200",
  badge: "bg-zinc-100 text-zinc-700",
  heading: "text-zinc-800",
};

/** Safe lookup — tolerates legacy values (e.g. an old "Evening Snack"). */
export function mealTypeColor(t: string): MealTypeColor {
  return COLORS[t as MealType] ?? FALLBACK;
}
