// Shared option lists + helpers for the creatable selects (category,
// cuisine, tags). "Defaults" are the prefilled suggestions; anything the
// family has already typed in the DB is merged on top.

export const DEFAULT_CATEGORIES = [
  "Component",
  "Breakfast",
  "Bread",
  "Grain",
  "Snack",
  "Beverage",
  "Side",
  "Salad",
  "Dessert",
];

export const DEFAULT_CUISINES = [
  "North Indian",
  "South Indian",
  "Punjabi",
  "Gujarati",
  "Maharashtrian",
  "Bengali",
  "Rajasthani",
  "Indo-Chinese",
  "Continental",
  "Italian",
  "Mexican",
  "Thai",
];

/** Defaults first (in given order), then any extra DB values, sorted. */
export function mergeOptions(
  defaults: string[],
  fromDb: (string | null | undefined)[]
): string[] {
  const seen = new Set(defaults.map((d) => d.toLowerCase()));
  const extra: string[] = [];
  for (const v of fromDb) {
    const t = (v ?? "").trim();
    if (t && !seen.has(t.toLowerCase())) {
      seen.add(t.toLowerCase());
      extra.push(t);
    }
  }
  return [...defaults, ...extra.sort((a, b) => a.localeCompare(b))];
}

/** "a, b , c" -> ["a", "b", "c"] */
export function splitTags(s: string): string[] {
  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Distinct, sorted tags across a set of rows with a comma-joined `tags`. */
export function collectTags(
  rows: { tags: string | null | undefined }[]
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of rows) {
    for (const t of splitTags(r.tags ?? "")) {
      const key = t.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(t);
      }
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}
