"use client";
import { useState, useTransition } from "react";
import { Plus, Sparkle } from "@phosphor-icons/react/dist/ssr";
import type { Meal, MealType, Season, Dish } from "@/lib/db/types";
import { DishPicker } from "@/components/dish-picker";

const MEAL_TYPES: MealType[] = [
  "Breakfast",
  "Lunch",
  "Evening Snack",
  "Dinner",
];
const SEASONS: Season[] = ["All", "Summer", "Winter"];

type DishLite = Pick<Dish, "id" | "name_en" | "name_hi" | "category">;

/**
 * Case-insensitive substring match: returns the dish whose name_en
 * best matches the given suggestion, or null if no reasonable match.
 */
function matchDishName(
  allDishes: DishLite[],
  suggestion: string
): DishLite | null {
  const target = suggestion.trim().toLowerCase();
  if (!target) return null;
  // exact match first
  const exact = allDishes.find((d) => d.name_en.toLowerCase() === target);
  if (exact) return exact;
  // substring either way (e.g., "Rice" matches "Basmati Rice")
  const partial = allDishes.find((d) => {
    const n = d.name_en.toLowerCase();
    return n.includes(target) || target.includes(n);
  });
  return partial ?? null;
}

export function MealForm({
  initial,
  initialDishIds = [],
  allDishes,
  action,
}: {
  initial?: Partial<Meal>;
  initialDishIds?: string[];
  allDishes: DishLite[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [name_en, setNameEn] = useState(initial?.name_en ?? "");
  const [name_hi, setNameHi] = useState(initial?.name_hi ?? "");
  const [meal_type, setMealType] = useState<MealType>(
    (initial?.meal_type ?? "Lunch") as MealType
  );
  const [weight, setWeight] = useState(initial?.weight ?? 5);
  const [cuisine, setCuisine] = useState(initial?.cuisine ?? "");
  const [tags, setTags] = useState(initial?.tags ?? "");
  const [effort, setEffort] = useState<number | "">(initial?.effort ?? "");
  const [season, setSeason] = useState<Season>(
    (initial?.season ?? "All") as Season
  );
  const [guest_worthy, setGuestWorthy] = useState(
    initial?.guest_worthy ?? false
  );
  const [active, setActive] = useState(initial?.active ?? true);
  const [selectedDishIds, setSelectedDishIds] =
    useState<string[]>(initialDishIds);
  const [missingDishNames, setMissingDishNames] = useState<string[]>([]);
  const [filling, startFill] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  async function autofill() {
    if (!name_en) return;
    setErr(null);
    setMissingDishNames([]);
    startFill(async () => {
      const res = await fetch("/api/autofill/meal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name_en, meal_type }),
      });
      if (!res.ok) {
        setErr("Auto-fill failed — check your Gemini key.");
        return;
      }
      const data = (await res.json()) as {
        name_hi: string;
        dishes: string[];
      };
      setNameHi(data.name_hi);

      // Match each suggested dish name against the DB; auto-select matches
      const matchedIds = new Set<string>(selectedDishIds);
      const missing: string[] = [];
      for (const name of data.dishes ?? []) {
        const match = matchDishName(allDishes, name);
        if (match) {
          matchedIds.add(match.id);
        } else {
          missing.push(name);
        }
      }
      setSelectedDishIds(Array.from(matchedIds));
      setMissingDishNames(missing);
    });
  }

  return (
    <form action={action} className="max-w-2xl space-y-4">
      <Field label="Name (English)">
        <input
          name="name_en"
          value={name_en}
          onChange={(e) => setNameEn(e.target.value)}
          required
          className="input"
        />
      </Field>

      <div className="flex items-end gap-3">
        <Field label="Name (Hindi)" className="flex-1">
          <input
            name="name_hi"
            value={name_hi}
            onChange={(e) => setNameHi(e.target.value)}
            required
            className="input"
          />
        </Field>
        <button
          type="button"
          onClick={autofill}
          disabled={!name_en || filling}
          className="btn btn-secondary h-[42px] shrink-0"
        >
          <Sparkle size={16} weight="bold" />
          {filling ? "Filling…" : "Auto-fill"}
        </button>
      </div>
      {err && <p className="text-xs text-red-700">{err}</p>}

      {missingDishNames.length > 0 && (
        <div className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm">
          <p className="text-zinc-900">
            <strong className="font-semibold">Not in your DB yet:</strong>
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {missingDishNames.map((n) => (
              <a
                key={n}
                href={`/dishes/new?name=${encodeURIComponent(n)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs hover:border-black"
              >
                <Plus size={12} weight="bold" />
                Create &ldquo;{n}&rdquo;
              </a>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            After creating, refresh this page and tap Auto-fill again to pick them up.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Meal type">
          <select
            name="meal_type"
            value={meal_type}
            onChange={(e) => setMealType(e.target.value as MealType)}
            className="input"
          >
            {MEAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Weight (1–10)">
          <input
            name="weight"
            type="number"
            min={1}
            max={10}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="input"
          />
        </Field>
      </div>

      <Field label="Constituent dishes">
        <DishPicker
          allDishes={allDishes}
          selectedIds={selectedDishIds}
          onChange={setSelectedDishIds}
          name="dish_ids"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Cuisine">
          <input
            name="cuisine"
            value={cuisine ?? ""}
            onChange={(e) => setCuisine(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Tags">
          <input
            name="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Effort (1–5)">
          <input
            name="effort"
            type="number"
            min={1}
            max={5}
            value={effort}
            onChange={(e) =>
              setEffort(e.target.value ? Number(e.target.value) : "")
            }
            className="input"
          />
        </Field>
        <Field label="Season">
          <select
            name="season"
            value={season}
            onChange={(e) => setSeason(e.target.value as Season)}
            className="input"
          >
            {SEASONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Guest-worthy?">
          <select
            name="guest_worthy"
            value={guest_worthy ? "yes" : "no"}
            onChange={(e) => setGuestWorthy(e.target.value === "yes")}
            className="input"
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </Field>
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Active
      </label>

      <div className="pt-3">
        <button type="submit" className="btn btn-primary">
          Save meal
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
