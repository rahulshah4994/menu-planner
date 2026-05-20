"use client";
import { useEffect, useOptimistic, useState, startTransition } from "react";
import {
  X,
  MagnifyingGlass,
  Check,
  Plus,
  Trash,
} from "@phosphor-icons/react/dist/ssr";
import { formatDayLabel, parseISODate } from "@/lib/dates";
import { mealTypeColor } from "@/lib/meal-colors";
import {
  addMealToSlot,
  removeMealFromSlot,
  addAddonToSlot,
  removeAddonFromSlot,
  setEatingOut,
  setGuests,
  setNote,
  clearSlot,
} from "./actions";
import {
  ADDON_CATS,
  type AddonCategory,
  type AddonLite,
  type MealLite,
  type PlanState,
  type Slot,
} from "./types";

type Action =
  | { type: "ADD_MEAL"; meal: MealLite }
  | { type: "REMOVE_MEAL"; id: string }
  | { type: "ADD_ADDON"; addon: AddonLite }
  | { type: "REMOVE_ADDON"; id: string }
  | { type: "EATING_OUT"; value: boolean }
  | { type: "GUESTS"; value: number }
  | { type: "NOTE"; value: string | null }
  | { type: "CLEAR" };

function reduce(state: PlanState, action: Action): PlanState {
  switch (action.type) {
    case "ADD_MEAL":
      return { ...state, meals: [...state.meals, action.meal] };
    case "REMOVE_MEAL":
      return { ...state, meals: state.meals.filter((m) => m.id !== action.id) };
    case "ADD_ADDON":
      return { ...state, addons: [...state.addons, action.addon] };
    case "REMOVE_ADDON":
      return {
        ...state,
        addons: state.addons.filter((a) => a.id !== action.id),
      };
    case "EATING_OUT":
      return { ...state, eating_out: action.value };
    case "GUESTS":
      return { ...state, guests: action.value };
    case "NOTE":
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

export function SlotEditor({
  date,
  slot,
  plan,
  meals,
  addonsByCategory,
  onClose,
}: {
  date: string;
  slot: Slot;
  plan: PlanState;
  meals: MealLite[];
  addonsByCategory: Record<AddonCategory, AddonLite[]>;
  onClose: () => void;
}) {
  const [opt, dispatch] = useOptimistic(plan, reduce);
  const [q, setQ] = useState("");
  const [noteDraft, setNoteDraft] = useState(plan.today_note ?? "");
  const c = mealTypeColor(slot);

  // Lock body scroll + close on Escape while the sheet is open.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const selMealIds = new Set(opt.meals.map((m) => m.id));
  const selAddonIds = new Set(opt.addons.map((a) => a.id));

  function toggleMeal(m: MealLite) {
    startTransition(async () => {
      if (selMealIds.has(m.id)) {
        dispatch({ type: "REMOVE_MEAL", id: m.id });
        await removeMealFromSlot(date, slot, m.id);
      } else {
        dispatch({ type: "ADD_MEAL", meal: m });
        await addMealToSlot(date, slot, m.id);
      }
    });
  }

  function toggleAddon(a: AddonLite) {
    startTransition(async () => {
      if (selAddonIds.has(a.id)) {
        dispatch({ type: "REMOVE_ADDON", id: a.id });
        await removeAddonFromSlot(date, slot, a.id);
      } else {
        dispatch({ type: "ADD_ADDON", addon: a });
        await addAddonToSlot(date, slot, a.id);
      }
    });
  }

  function onEatingOut(value: boolean) {
    startTransition(async () => {
      dispatch({ type: "EATING_OUT", value });
      await setEatingOut(date, slot, value);
    });
  }

  function onGuests(delta: number) {
    const next = Math.max(0, opt.guests + delta);
    startTransition(async () => {
      dispatch({ type: "GUESTS", value: next });
      await setGuests(date, slot, next);
    });
  }

  function saveNote() {
    const v = noteDraft.trim();
    if ((plan.today_note ?? "") === v) return;
    startTransition(async () => {
      dispatch({ type: "NOTE", value: v || null });
      await setNote(date, slot, v);
    });
  }

  function onClear() {
    if (!confirm("Clear this slot entirely?")) return;
    setNoteDraft("");
    startTransition(async () => {
      dispatch({ type: "CLEAR" });
      await clearSlot(date, slot);
    });
  }

  const norm = q.trim().toLowerCase();
  const match = (it: { name_en: string; name_hi: string }) =>
    !norm ||
    it.name_en.toLowerCase().includes(norm) ||
    it.name_hi.includes(q.trim());

  const mealsF = meals.filter(match);
  const catGroups = ADDON_CATS.map((cat) => ({
    cat,
    items: (addonsByCategory[cat] ?? []).filter(match),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[88vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl"
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between rounded-t-2xl border-b border-zinc-200 px-4 py-3 ${c.bg}`}
        >
          <div>
            <h3
              className={`text-sm font-semibold uppercase tracking-wide ${c.heading}`}
            >
              {slot}
            </h3>
            <p className="text-xs text-zinc-500">
              {formatDayLabel(parseISODate(date))}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-zinc-500 hover:bg-white/60 hover:text-black"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <label className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={opt.eating_out}
              onChange={(e) => onEatingOut(e.target.checked)}
            />
            <span>Eating out</span>
          </label>

          {!opt.eating_out && (
            <>
              {(opt.meals.length > 0 || opt.addons.length > 0) && (
                <div className="flex flex-wrap gap-1.5 border-b border-zinc-100 px-4 py-3">
                  {opt.meals.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMeal(m)}
                      className="inline-flex items-center gap-1 rounded-md bg-black py-1 pl-2.5 pr-1.5 text-xs text-white"
                    >
                      {m.name_en}
                      <X size={12} weight="bold" />
                    </button>
                  ))}
                  {opt.addons.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAddon(a)}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white py-1 pl-2 pr-1.5 text-xs"
                    >
                      <span className="text-[10px] uppercase text-zinc-500">
                        {a.category[0]}
                      </span>
                      {a.name_en}
                      <X size={11} weight="bold" />
                    </button>
                  ))}
                </div>
              )}

              <div className="px-4 py-3">
                <div className="relative">
                  <MagnifyingGlass
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search meals & dishes…"
                    className="input pl-9"
                  />
                </div>
              </div>

              <div className="px-2 pb-2">
                {mealsF.length > 0 && (
                  <Section title="Meals">
                    {mealsF.map((m) => (
                      <Row
                        key={m.id}
                        name_en={m.name_en}
                        name_hi={m.name_hi}
                        selected={selMealIds.has(m.id)}
                        onClick={() => toggleMeal(m)}
                      />
                    ))}
                  </Section>
                )}
                {catGroups.map((g) => (
                  <Section key={g.cat} title={`${g.cat}s`}>
                    {g.items.map((a) => (
                      <Row
                        key={a.id}
                        name_en={a.name_en}
                        name_hi={a.name_hi}
                        selected={selAddonIds.has(a.id)}
                        onClick={() => toggleAddon(a)}
                      />
                    ))}
                  </Section>
                ))}
                {mealsF.length === 0 && catGroups.length === 0 && (
                  <p className="px-3 py-8 text-center text-sm text-zinc-400">
                    {norm
                      ? `No matches for “${q.trim()}”.`
                      : "Nothing in your database yet."}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Guests + note */}
          <div className="space-y-3 border-t border-zinc-100 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-zinc-500">Guests</span>
              <button
                type="button"
                disabled={opt.guests <= 0}
                onClick={() => onGuests(-1)}
                className="h-7 w-7 rounded-md border border-zinc-300 hover:bg-zinc-100 disabled:opacity-40"
              >
                −
              </button>
              <span className="min-w-[1.5ch] text-center font-medium">
                {opt.guests}
              </span>
              <button
                type="button"
                onClick={() => onGuests(1)}
                className="h-7 w-7 rounded-md border border-zinc-300 hover:bg-zinc-100"
              >
                +
              </button>
            </div>
            <label className="block text-sm">
              <span className="text-zinc-500">Note</span>
              <input
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                onBlur={saveNote}
                placeholder="e.g. less spicy today"
                className="input mt-1"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-zinc-200 p-3">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-zinc-500 hover:text-red-700"
          >
            <Trash size={15} weight="bold" />
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function Row({
  name_en,
  name_hi,
  selected,
  onClick,
}: {
  name_en: string;
  name_hi: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
        selected ? "bg-black text-white" : "text-black hover:bg-zinc-100"
      }`}
    >
      <span className="flex flex-col">
        <span className="text-sm font-medium">{name_en}</span>
        {name_hi && (
          <span
            className={`text-xs ${
              selected ? "text-zinc-300" : "text-zinc-400"
            }`}
          >
            {name_hi}
          </span>
        )}
      </span>
      {selected ? (
        <Check size={16} weight="bold" className="shrink-0" />
      ) : (
        <Plus size={16} weight="bold" className="shrink-0 text-zinc-400" />
      )}
    </button>
  );
}
