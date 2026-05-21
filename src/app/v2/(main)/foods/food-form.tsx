"use client";
import { useState, useTransition } from "react";
import type { Food } from "@/lib/v2/types";

export function FoodForm({
  initial,
  categories,
  action,
}: {
  initial?: Partial<Food>;
  categories: string[];
  action: (fd: FormData) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nameHi, setNameHi] = useState(initial?.name_hi ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [ingredients, setIngredients] = useState(initial?.ingredients ?? "");
  const [ingredientsHi, setIngredientsHi] = useState(
    initial?.ingredients_hi ?? ""
  );
  const [recipeUrl, setRecipeUrl] = useState(initial?.recipe_url ?? "");
  const [weight, setWeight] = useState(initial?.weight ?? 5);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [filling, startFill] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function autofill() {
    if (!name) return;
    setErr(null);
    startFill(async () => {
      const res = await fetch("/api/autofill/dish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name_en: name,
          category: category.trim() || "general",
        }),
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
    <form action={action} className="max-w-xl space-y-4">
      <Field label="Name (English)">
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={filling}
          className="input"
        />
      </Field>

      <div className="flex items-end gap-3">
        <Field label="Name (Hindi)" className="flex-1">
          <input
            name="name_hi"
            value={nameHi}
            onChange={(e) => setNameHi(e.target.value)}
            disabled={filling}
            className="input"
          />
        </Field>
        <button
          type="button"
          onClick={autofill}
          disabled={!name || filling}
          className="btn btn-secondary h-[42px] shrink-0"
        >
          {filling ? "..." : "✨ Auto-fill"}
        </button>
      </div>
      {err && <p className="text-xs text-red-700">{err}</p>}

      <Field label="Category">
        <input
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          list="food-categories"
          autoComplete="off"
          disabled={filling}
          className="input"
        />
        <datalist id="food-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>

      <Field label="Ingredients — English (comma-separated)">
        <textarea
          name="ingredients"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          rows={2}
          disabled={filling}
          className="input"
        />
      </Field>

      <Field label="Ingredients — Hindi (comma-separated)">
        <textarea
          name="ingredients_hi"
          value={ingredientsHi}
          onChange={(e) => setIngredientsHi(e.target.value)}
          rows={2}
          disabled={filling}
          className="input"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Recipe URL">
          <input
            name="recipe_url"
            type="url"
            value={recipeUrl ?? ""}
            onChange={(e) => setRecipeUrl(e.target.value)}
            disabled={filling}
            className="input"
          />
        </Field>
        <Field label="Weight (1–10)">
          <input
            name="weight"
            type="number"
            min={1}
            max={10}
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            disabled={filling}
            className="input"
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          disabled={filling}
          className="input"
        />
      </Field>

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

      <div className="pt-2">
        <button type="submit" disabled={filling} className="btn btn-primary">
          Save food
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
