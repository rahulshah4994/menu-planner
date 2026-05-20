"use client";
import {
  useOptimistic,
  startTransition,
  useTransition,
  useState,
} from "react";
import {
  Shuffle,
  CircleNotch,
  X,
  Trash,
  Plus,
} from "@phosphor-icons/react/dist/ssr";
import { AddSheet } from "./add-sheet";
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [randomising, startRandomise] = useTransition();

  function onMealPick(meal: MealLite) {
    startTransition(async () => {
      dispatch({ type: "ADD_MEAL", meal });
      await addMealToSlot(date, slot, meal.id);
    });
  }

  function onMealRemove(mealId: string) {
    startTransition(async () => {
      dispatch({ type: "REMOVE_MEAL", mealId });
      await removeMealFromSlot(date, slot, mealId);
    });
  }

  function onAddonPick(addon: DishLite) {
    startTransition(async () => {
      dispatch({ type: "ADD_ADDON", addon });
      await addAddonToSlot(date, slot, addon.id);
    });
  }

  function onAddonRemove(dishId: string) {
    startTransition(async () => {
      dispatch({ type: "REMOVE_ADDON", dishId });
      await removeAddonFromSlot(date, slot, dishId);
    });
  }

  function toggleMeal(meal: MealLite) {
    if (opt.meals.some((m) => m.id === meal.id)) onMealRemove(meal.id);
    else onMealPick(meal);
  }

  function toggleAddon(dish: DishLite) {
    if (opt.addons.some((a) => a.id === dish.id)) onAddonRemove(dish.id);
    else onAddonPick(dish);
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
    startRandomise(async () => {
      await randomiseSlot(date, slot);
    });
  }

  const selectedMealIds = new Set(opt.meals.map((m) => m.id));
  const selectedAddonIds = new Set(opt.addons.map((a) => a.id));
  const isEmpty =
    opt.meals.length === 0 &&
    opt.addons.length === 0 &&
    !opt.eating_out;

  return (
    <div className="rounded-md border border-zinc-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-black">
          {slot}
        </h3>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onRandomise}
            disabled={randomising}
            aria-label="Randomise this slot"
            aria-busy={randomising}
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-black disabled:opacity-60"
          >
            {randomising ? (
              <CircleNotch size={16} weight="bold" className="animate-spin" />
            ) : (
              <Shuffle size={16} weight="bold" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("Clear this slot entirely?")) onClear();
            }}
            aria-label="Clear slot"
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-black"
          >
            <Trash size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* Selected meals + add-ons */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {opt.meals.map((m) => (
          <span
            key={m.id}
            className="inline-flex items-center gap-1 rounded-md bg-black py-1 pl-2.5 pr-1 text-xs text-white"
          >
            {m.name_en}
            <button
              type="button"
              onClick={() => onMealRemove(m.id)}
              aria-label={`Remove ${m.name_en}`}
              className="rounded p-0.5 text-zinc-300 hover:text-white"
            >
              <X size={12} weight="bold" />
            </button>
          </span>
        ))}
        {opt.addons.map((a) => (
          <span
            key={a.id}
            className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white py-1 pl-2 pr-1 text-xs"
          >
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">
              {a.category[0]}
            </span>
            {a.name_en}
            <button
              type="button"
              onClick={() => onAddonRemove(a.id)}
              aria-label={`Remove ${a.name_en}`}
              className="rounded p-0.5 text-zinc-500 hover:text-black"
            >
              <X size={11} weight="bold" />
            </button>
          </span>
        ))}
        {isEmpty && (
          <span className="text-xs text-zinc-400">Nothing picked yet</span>
        )}
        {opt.eating_out && <span className="tag-soft">🍽 Eating out</span>}
      </div>

      {/* Add button */}
      {!opt.eating_out && (
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="mt-3 flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-zinc-300 py-2 text-xs font-medium text-zinc-600 hover:border-black hover:bg-zinc-50 hover:text-black"
        >
          <Plus size={14} weight="bold" />
          Add meal or dish
        </button>
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
            className="h-7 w-7 rounded-md border border-zinc-300 hover:bg-zinc-100 disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-[1.5ch] text-center text-sm font-medium">
            {opt.guests}
          </span>
          <button
            type="button"
            onClick={() => onGuestsChange(1)}
            className="h-7 w-7 rounded-md border border-zinc-300 hover:bg-zinc-100"
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

      <AddSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        slot={slot}
        meals={availableMeals}
        addonsByCategory={availableAddons}
        selectedMealIds={selectedMealIds}
        selectedAddonIds={selectedAddonIds}
        onToggleMeal={toggleMeal}
        onToggleAddon={toggleAddon}
      />
    </div>
  );
}
