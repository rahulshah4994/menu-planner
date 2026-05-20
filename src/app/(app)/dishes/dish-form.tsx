"use client";
import { useState, useTransition } from "react";
import type { Dish, DishCategory } from "@/lib/db/types";

const CATEGORIES: DishCategory[] = [
  "Component",
  "Bread",
  "Grain",
  "Snack",
  "Beverage",
  "Side",
  "Salad",
  "Dessert",
];

export function DishForm({
  initial,
  action,
}: {
  initial?: Partial<Dish>;
  action: (formData: FormData) => Promise<void>;
}) {
  const [name_en, setNameEn] = useState(initial?.name_en ?? "");
  const [name_hi, setNameHi] = useState(initial?.name_hi ?? "");
  const [category, setCategory] = useState<DishCategory>(
    (initial?.category ?? "Component") as DishCategory
  );
  const [ingredients, setIngredients] = useState(initial?.ingredients ?? "");
  const [ingredients_hi, setIngredientsHi] = useState(
    initial?.ingredients_hi ?? ""
  );
  const [recipe_url, setRecipeUrl] = useState(initial?.recipe_url ?? "");
  const [cuisine, setCuisine] = useState(initial?.cuisine ?? "");
  const [tags, setTags] = useState(initial?.tags ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
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
          {filling ? "..." : "✨ Auto-fill"}
        </button>
      </div>
      {err && <p className="text-xs text-red-700">{err}</p>}

      <Field label="Category">
        <select
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as DishCategory)}
          className="input"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Ingredients — English (comma-separated, drives grocery list)">
        <textarea
          name="ingredients"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          rows={2}
          className="input"
        />
      </Field>

      <Field label="Ingredients — Hindi (comma-separated, shown to the cook)">
        <textarea
          name="ingredients_hi"
          value={ingredients_hi}
          onChange={(e) => setIngredientsHi(e.target.value)}
          rows={2}
          className="input"
        />
      </Field>

      <Field label="Recipe URL (optional)">
        <input
          name="recipe_url"
          type="url"
          value={recipe_url ?? ""}
          onChange={(e) => setRecipeUrl(e.target.value)}
          className="input"
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
