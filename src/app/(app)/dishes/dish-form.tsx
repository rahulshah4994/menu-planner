"use client";
import { useState, useTransition } from "react";
import type { Dish, MealType } from "@/lib/db/types";
import { CreatableSelect } from "@/components/creatable-select";
import { TagInput } from "@/components/tag-input";
import { splitTags } from "@/lib/options";

const MEAL_TYPES: MealType[] = ["Breakfast", "Lunch", "Dinner"];

export function DishForm({
  initial,
  initialMeal,
  categoryOptions,
  cuisineOptions,
  tagOptions,
  action,
}: {
  initial?: Partial<Dish>;
  initialMeal?: { meal_type: MealType; weight: number } | null;
  categoryOptions: string[];
  cuisineOptions: string[];
  tagOptions: string[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [name_en, setNameEn] = useState(initial?.name_en ?? "");
  const [name_hi, setNameHi] = useState(initial?.name_hi ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Component");
  const [ingredients, setIngredients] = useState(initial?.ingredients ?? "");
  const [ingredients_hi, setIngredientsHi] = useState(
    initial?.ingredients_hi ?? ""
  );
  const [recipe_url, setRecipeUrl] = useState(initial?.recipe_url ?? "");
  const [cuisine, setCuisine] = useState(initial?.cuisine ?? "");
  const [tags, setTags] = useState<string[]>(splitTags(initial?.tags ?? ""));
  const [active, setActive] = useState(initial?.active ?? true);
  const [isOnePot, setIsOnePot] = useState(initial?.is_one_pot ?? false);
  const [mealType, setMealType] = useState<MealType>(
    initialMeal?.meal_type ?? "Lunch"
  );
  const [mealWeight, setMealWeight] = useState(initialMeal?.weight ?? 5);
  const [filling, startFill] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  async function autofill() {
    if (!name_en) return;
    setErr(null);
    startFill(async () => {
      const res = await fetch("/api/autofill/dish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name_en, category }),
      });
      if (!res.ok) {
        setErr("Auto-fill failed — check your Gemini key.");
        return;
      }
      const data = (await res.json()) as {
        name_hi: string;
        ingredients: string[];
        ingredients_hi: string[];
      };
      setNameHi(data.name_hi);
      setIngredients(data.ingredients.join(", "));
      setIngredientsHi(data.ingredients_hi.join(", "));
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
          disabled={filling}
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
            disabled={filling}
            className="input"
          />
        </Field>
        <button
          type="button"
          onClick={autofill}
          disabled={!name_en || filling}
          className="btn btn-secondary h-[42px] shrink-0"
        >
          {filling ? "..." : "✨ Auto-fill"}
        </button>
      </div>
      {err && <p className="text-xs text-red-700">{err}</p>}

      <Field label="Category">
        <CreatableSelect
          name="category"
          value={category}
          onChange={setCategory}
          options={categoryOptions}
          disabled={filling}
          required
          placeholder="Pick or type a category…"
        />
      </Field>

      <Field label="Ingredients — English (comma-separated, drives grocery list)">
        <textarea
          name="ingredients"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          rows={2}
          disabled={filling}
          className="input"
        />
      </Field>

      <Field label="Ingredients — Hindi (comma-separated, shown to the cook)">
        <textarea
          name="ingredients_hi"
          value={ingredients_hi}
          onChange={(e) => setIngredientsHi(e.target.value)}
          rows={2}
          disabled={filling}
          className="input"
        />
      </Field>

      <Field label="Recipe URL (optional)">
        <input
          name="recipe_url"
          type="url"
          value={recipe_url ?? ""}
          onChange={(e) => setRecipeUrl(e.target.value)}
          disabled={filling}
          className="input"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Cuisine">
          <CreatableSelect
            name="cuisine"
            value={cuisine ?? ""}
            onChange={setCuisine}
            options={cuisineOptions}
            disabled={filling}
            placeholder="Pick or type…"
          />
        </Field>
        <Field label="Tags">
          <TagInput
            name="tags"
            value={tags}
            onChange={setTags}
            suggestions={tagOptions}
            disabled={filling}
          />
        </Field>
      </div>

      <div className="rounded-lg border border-zinc-200 p-3">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700">
          <input
            type="checkbox"
            name="is_one_pot"
            checked={isOnePot}
            onChange={(e) => setIsOnePot(e.target.checked)}
            disabled={filling}
          />
          One-pot meal (plannable on its own)
        </label>
        {isOnePot && (
          <>
            <p className="mt-1 text-xs text-zinc-500">
              A matching meal is created/kept in sync so you can add this dish
              straight to the planner.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Meal type">
                <select
                  name="meal_type"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealType)}
                  disabled={filling}
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
                  name="meal_weight"
                  type="number"
                  min={1}
                  max={10}
                  value={mealWeight}
                  onChange={(e) => setMealWeight(Number(e.target.value))}
                  disabled={filling}
                  className="input"
                />
              </Field>
            </div>
          </>
        )}
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          disabled={filling}
        />
        Active
      </label>

      <div className="pt-3">
        <button type="submit" disabled={filling} className="btn btn-primary">
          Save dish
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
