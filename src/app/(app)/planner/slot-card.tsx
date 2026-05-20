"use client";
import { useOptimistic, startTransition } from "react";
import Link from "next/link";
import {
  Shuffle,
  X,
  Trash,
  CaretDown,
  Plus,
} from "@phosphor-icons/react/dist/ssr";
import {
  addMealToSlot,
  removeMealFromSlot,
  addAddonToSlot,
  removeAddonFromSlot,
  setEatingOut,
  setGuests,
  setNote,
  randomiseSlot,
  clearSlot,
} from "./actions";

type Slot = "Breakfast" | "Lunch" | "Evening Snack" | "Dinner";

interface MealLite {
  id: string;
  name_en: string;
  name_hi: string;
}
interface DishLite {
  id: string;
  name_en: string;
  name_hi: string;
  category: "Beverage" | "Side" | "Salad" | "Dessert";
}

interface PlanState {
  meals: MealLite[];
  addons: DishLite[];
  eating_out: boolean;
  guests: number;
  today_note: string | null;
}

type OptimisticAction =
  | { type: "ADD_MEAL"; meal: MealLite }
  | { type: "REMOVE_MEAL"; mealId: string }
  | { type: "ADD_ADDON"; addon: DishLite }
  | { type: "REMOVE_ADDON"; dishId: string }
  | { type: "SET_EATING_OUT"; value: boolean }
  | { type: "SET_GUESTS"; value: number }
  | { type: "SET_NOTE"; value: string | null }
  | { type: "CLEAR" };

function reduce(state: PlanState, action: OptimisticAction): PlanState {
  switch (action.type) {
    case "ADD_MEAL":
      return { ...state, meals: [...state.meals, action.meal] };
    case "REMOVE_MEAL":
      return {
        ...state,
        meals: state.meals.filter((m) => m.id !== action.mealId),
      };
    case "ADD_ADDON":
      return { ...state, addons: [...state.addons, action.addon] };
    case "REMOVE_ADDON":
      return {
        ...state,
        addons: state.addons.filter((d) => d.id !== action.dishId),
      };
    case "SET_EATING_OUT":
      return { ...state, eating_out: action.value };
    case "SET_GUESTS":
      return { ...state, guests: action.value };
    case "SET_NOTE":
      return { ...state, today_note: action.value };
    case "CLEAR":
      return {
        meals: [],
        addons: [],
        eating_out: false,
        guests: 0,
        today_note: null,
      };
  }
}

export function SlotCard({
  date,
  slot,
  plan,
  availableMeals,
  availableAddons,
}: {
  date: string;
  slot: Slot;
  plan: PlanState;
  availableMeals: MealLite[];
  availableAddons: Record<
    "Beverage" | "Side" | "Salad" | "Dessert",
    DishLite[]
  >;
}) {
  const [opt, dispatch] = useOptimistic<PlanState, OptimisticAction>(
    plan,
    reduce
  );

  function onMealPick(mealId: string) {
    if (!mealId) return;
    const meal = availableMeals.find((m) => m.id === mealId);
    if (!meal) return;
    startTransition(async () => {
      dispatch({ type: "ADD_MEAL", meal });
      await addMealToSlot(date, slot, mealId);
    });
  }

  function onMealRemove(mealId: string) {
    startTransition(async () => {
      dispatch({ type: "REMOVE_MEAL", mealId });
      await removeMealFromSlot(date, slot, mealId);
    });
  }

  function onAddonPick(category: keyof typeof availableAddons, dishId: string) {
    if (!dishId) return;
    const addon = availableAddons[category].find((d) => d.id === dishId);
    if (!addon) return;
    startTransition(async () => {
      dispatch({ type: "ADD_ADDON", addon });
      await addAddonToSlot(date, slot, dishId);
    });
  }

  function onAddonRemove(dishId: string) {
    startTransition(async () => {
      dispatch({ type: "REMOVE_ADDON", dishId });
      await removeAddonFromSlot(date, slot, dishId);
    });
  }

  function onToggleEatingOut(value: boolean) {
    startTransition(async () => {
      dispatch({ type: "SET_EATING_OUT", value });
      await setEatingOut(date, slot, value);
    });
  }

  function onGuestsChange(delta: number) {
    const next = Math.max(0, opt.guests + delta);
    startTransition(async () => {
      dispatch({ type: "SET_GUESTS", value: next });
      await setGuests(date, slot, next);
    });
  }

  function onNoteSave(note: string) {
    startTransition(async () => {
      dispatch({ type: "SET_NOTE", value: note.trim() || null });
      await setNote(date, slot, note);
    });
  }

  function onClear() {
    startTransition(async () => {
      dispatch({ type: "CLEAR" });
      await clearSlot(date, slot);
    });
  }

  function onRandomise() {
    // randomiseSlot replaces meals — we'll let the server result re-render.
    // No optimistic state because we don't know which meal will be picked.
    startTransition(async () => {
      await randomiseSlot(date, slot);
    });
  }

  const pickedMealIds = new Set(opt.meals.map((m) => m.id));
  const remainingMeals = availableMeals.filter((m) => !pickedMealIds.has(m.id));

  return (
    <div className="rounded-md border border-zinc-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-black">
          {slot}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRandomise}
            aria-label="Randomise this slot"
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-black"
          >
            <Shuffle size={16} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("Clear this slot entirely?")) onClear();
            }}
            aria-label="Clear slot"
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-black"
          >
            <Trash size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* Meals */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {opt.meals.map((m) => (
          <span
            key={m.id}
            className="inline-flex items-center gap-1 rounded-md bg-black px-2.5 py-1 text-xs text-white"
          >
            {m.name_en}
            <button
              type="button"
              onClick={() => onMealRemove(m.id)}
              aria-label={`Remove ${m.name_en}`}
              className="text-zinc-300 hover:text-white"
            >
              <X size={12} weight="bold" />
            </button>
          </span>
        ))}
        {opt.meals.length === 0 && !opt.eating_out && (
          <span className="text-xs text-zinc-400">No meal picked yet</span>
        )}
        {opt.eating_out && <span className="tag-soft">🍽 Eating out</span>}
      </div>

      {/* Add-meal button */}
      {!opt.eating_out && (
        <div className="mt-2">
          {availableMeals.length === 0 ? (
            <p className="text-xs text-zinc-400">
              No {slot.toLowerCase()} meals in your DB.{" "}
              <Link href="/meals/new" className="text-black underline">
                Create one →
              </Link>
            </p>
          ) : remainingMeals.length === 0 ? (
            <p className="text-xs text-zinc-400">All available meals picked.</p>
          ) : (
            <PickerSelect
              label={opt.meals.length === 0 ? "Add meal" : "Add another meal"}
              options={remainingMeals.map((m) => ({
                value: m.id,
                label: m.name_en,
              }))}
              onPick={onMealPick}
            />
          )}
        </div>
      )}

      {/* Add-ons */}
      {!opt.eating_out && (
        <div className="mt-4 border-t border-zinc-100 pt-3">
          {opt.addons.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {opt.addons.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-0.5 text-xs"
                >
                  <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                    {a.category[0]}
                  </span>
                  {a.name_en}
                  <button
                    type="button"
                    onClick={() => onAddonRemove(a.id)}
                    aria-label={`Remove ${a.name_en}`}
                    className="text-zinc-500 hover:text-black"
                  >
                    <X size={11} weight="bold" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-1.5">
            {(["Beverage", "Side", "Salad", "Dessert"] as const).map((cat) => {
              const pool = availableAddons[cat] ?? [];
              const pickedIds = new Set(
                opt.addons.filter((a) => a.category === cat).map((a) => a.id)
              );
              const remaining = pool.filter((p) => !pickedIds.has(p.id));
              return (
                <PickerSelect
                  key={cat}
                  label={`+ ${cat}`}
                  options={remaining.map((d) => ({
                    value: d.id,
                    label: d.name_en,
                  }))}
                  emptyLabel={pool.length === 0 ? "no dishes" : "all picked"}
                  onPick={(v) => onAddonPick(cat, v)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Eating out + guests */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-zinc-100 pt-3 text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={opt.eating_out}
            onChange={(e) => onToggleEatingOut(e.target.checked)}
          />
          <span>Eating out</span>
        </label>

        <div className="inline-flex items-center gap-1.5">
          <span className="text-zinc-500">Guests</span>
          <button
            type="button"
            disabled={opt.guests <= 0}
            onClick={() => onGuestsChange(-1)}
            className="h-6 w-6 rounded-md border border-zinc-300 hover:bg-zinc-100 disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-[1.5ch] text-center text-sm font-medium">
            {opt.guests}
          </span>
          <button
            type="button"
            onClick={() => onGuestsChange(1)}
            className="h-6 w-6 rounded-md border border-zinc-300 hover:bg-zinc-100"
          >
            +
          </button>
        </div>
      </div>

      {/* Today's note */}
      <details className="mt-3 text-sm" open={!!opt.today_note}>
        <summary className="cursor-pointer text-zinc-600 hover:text-black">
          {opt.today_note ? "📝 Note" : "+ Add note"}
        </summary>
        <form
          action={(fd) => onNoteSave(String(fd.get("note") ?? ""))}
          className="mt-2 flex gap-2"
        >
          <input
            name="note"
            type="text"
            defaultValue={opt.today_note ?? ""}
            placeholder="e.g. less spicy today"
            className="input flex-1"
          />
          <button type="submit" className="btn btn-secondary">
            Save
          </button>
        </form>
      </details>
    </div>
  );
}

/** Button-styled select that fires onPick when an option is chosen. */
function PickerSelect({
  label,
  options,
  onPick,
  emptyLabel,
}: {
  label: string;
  options: { value: string; label: string }[];
  onPick: (v: string) => void;
  emptyLabel?: string;
}) {
  const isEmpty = options.length === 0;
  return (
    <div className="relative inline-flex">
      <select
        disabled={isEmpty}
        value=""
        onChange={(e) => {
          onPick(e.target.value);
          e.target.value = "";
        }}
        className="
          cursor-pointer appearance-none rounded-md border border-zinc-300
          bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-black
          hover:border-black focus:border-black focus:outline-none
          disabled:cursor-not-allowed disabled:opacity-50
        "
        aria-label={label}
      >
        <option value="">
          {isEmpty ? `${label} (${emptyLabel ?? "none"})` : label}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <CaretDown
        size={12}
        weight="bold"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
      />
    </div>
  );
}

export { Plus };
