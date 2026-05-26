export const DEFAULT_CATEGORIES = [
  "Breakfast",
  "Lunch",
  "Snack",
  "Dinner",
] as const;

export function mergeCategories(fromDb: string[]): string[] {
  const dbClean = Array.from(new Set(fromDb.map((c) => c.trim()))).filter(
    Boolean
  );
  const defaultsLower = new Set(
    DEFAULT_CATEGORIES.map((d) => d.toLowerCase())
  );
  const extras = dbClean
    .filter((c) => !defaultsLower.has(c.toLowerCase()))
    .sort();
  return [...DEFAULT_CATEGORIES, ...extras];
}
