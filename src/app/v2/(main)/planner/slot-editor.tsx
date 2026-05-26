"use client";
import {
  startTransition,
  useEffect,
  useOptimistic,
  useState,
} from "react";
import {
  X,
  MagnifyingGlass,
  Check,
  Plus,
  Trash,
} from "@phosphor-icons/react/dist/ssr";
import { formatDayLabel, parseISODate } from "@/lib/dates";
import type { FoodLite, SlotWithFoods } from "@/lib/v2/types";
import {
  addFood,
  addSlot,
  deleteSlot,
  moveSlot,
  recolorSlot,
  removeFood,
  renameSlot,
} from "./actions";
import { SlotNameModal } from "./slot-name-modal";

type Action =
  | { type: "ADD_FOOD"; food: FoodLite }
  | { type: "REMOVE_FOOD"; id: string };

function reduce(state: FoodLite[], action: Action): FoodLite[] {
  switch (action.type) {
    case "ADD_FOOD":
      if (state.some((f) => f.id === action.food.id)) return state;
      return [...state, action.food];
    case "REMOVE_FOOD":
      return state.filter((f) => f.id !== action.id);
  }
}

function hexAlpha(hex: string, alpha: number) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function SlotEditor({
  date,
  dayPlanId,
  slot,
  allSlots,
  allFoods,
  onClose,
}: {
  date: string;
  dayPlanId: number;
  slot: SlotWithFoods;
  allSlots: SlotWithFoods[];
  allFoods: FoodLite[];
  onClose: () => void;
}) {
  const [opt, dispatch] = useOptimistic(slot.foods, reduce);
  const [q, setQ] = useState("");
  const [nameDraft, setNameDraft] = useState(slot.name);
  const [addingSlot, setAddingSlot] = useState(false);

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

  const selIds = new Set(opt.map((f) => f.id));
  const bg = hexAlpha(slot.color, 0.18);
  const headingColor = "text-zinc-800";

  function toggle(food: FoodLite) {
    startTransition(async () => {
      if (selIds.has(food.id)) {
        dispatch({ type: "REMOVE_FOOD", id: food.id });
        await removeFood(slot.id, food.id);
      } else {
        dispatch({ type: "ADD_FOOD", food });
        await addFood(slot.id, food.id);
      }
    });
  }

  function saveName() {
    const v = nameDraft.trim();
    if (!v || v === slot.name) return;
    startTransition(async () => {
      await renameSlot(slot.id, v);
    });
  }

  function onRecolor(color: string) {
    startTransition(async () => {
      await recolorSlot(slot.id, color);
    });
  }

  function onMove(dir: number) {
    startTransition(async () => {
      await moveSlot(dayPlanId, slot.id, dir);
    });
  }

  function onDelete() {
    if (!confirm(`Remove "${slot.name}" from this day?`)) return;
    startTransition(async () => {
      await deleteSlot(slot.id);
    });
    onClose();
  }

  function onAddSlot() {
    setAddingSlot(true);
  }

  const idx = allSlots.findIndex((s) => s.id === slot.id);
  const canMoveUp = idx > 0;
  const canMoveDown = idx >= 0 && idx < allSlots.length - 1;

  const norm = q.trim().toLowerCase();
  const matches = allFoods.filter(
    (f) =>
      !norm ||
      f.name.toLowerCase().includes(norm) ||
      (f.name_hi ?? "").includes(q.trim())
  );
  const slotKey = slot.name.trim().toLowerCase();
  const matched = matches.filter((f) =>
    (f.categories ?? []).some((c) => c.trim().toLowerCase() === slotKey)
  );
  const matchedIds = new Set(matched.map((f) => f.id));
  const others = matches.filter((f) => !matchedIds.has(f.id));

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
        <div
          className="flex items-start justify-between gap-3 rounded-t-2xl border-b border-zinc-200 px-4 py-3"
          style={{ backgroundColor: bg }}
        >
          <div className="min-w-0 flex-1">
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={saveName}
              className={`w-full bg-transparent text-sm font-semibold uppercase tracking-wide outline-none ${headingColor}`}
            />
            <p className="mt-0.5 text-xs text-zinc-500">
              {formatDayLabel(parseISODate(date))}
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <input
                type="color"
                defaultValue={slot.color}
                onChange={(e) => onRecolor(e.target.value)}
                aria-label="Slot colour"
                className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <button
                type="button"
                onClick={() => onMove(-1)}
                disabled={!canMoveUp}
                aria-label="Move up"
                className="rounded border border-zinc-300 bg-white/80 px-2 py-0.5 text-xs disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onMove(1)}
                disabled={!canMoveDown}
                aria-label="Move down"
                className="rounded border border-zinc-300 bg-white/80 px-2 py-0.5 text-xs disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={onAddSlot}
                className="rounded border border-zinc-300 bg-white/80 px-2 py-0.5 text-xs"
              >
                + Slot
              </button>
            </div>
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

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {opt.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-b border-zinc-100 px-4 py-3">
              {opt.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggle(f)}
                  className="inline-flex items-center gap-1 rounded-md bg-black py-1 pl-2.5 pr-1.5 text-xs text-white"
                >
                  {f.name}
                  <X size={12} weight="bold" />
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
                placeholder="Search foods…"
                className="input pl-9"
              />
            </div>
          </div>

          <div className="px-2 pb-2">
            {matches.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-zinc-400">
                {norm
                  ? `No matches for “${q.trim()}”.`
                  : "Nothing in your catalog yet."}
              </p>
            ) : (
              <>
                {matched.length > 0 && (
                  <Section title={slot.name}>
                    {matched.map((f) => (
                      <FoodRow
                        key={f.id}
                        food={f}
                        selected={selIds.has(f.id)}
                        onClick={() => toggle(f)}
                      />
                    ))}
                  </Section>
                )}
                {others.length > 0 && (
                  <Section title="Others">
                    {others.map((f) => (
                      <FoodRow
                        key={f.id}
                        food={f}
                        selected={selIds.has(f.id)}
                        onClick={() => toggle(f)}
                      />
                    ))}
                  </Section>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-zinc-200 p-3">
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-zinc-500 hover:text-red-700"
          >
            <Trash size={15} weight="bold" />
            Remove slot
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

      {addingSlot && (
        <SlotNameModal
          title="Add slot"
          defaultValue="Snack"
          onCancel={() => setAddingSlot(false)}
          onConfirm={(name) => {
            setAddingSlot(false);
            startTransition(async () => {
              await addSlot(dayPlanId, name);
            });
          }}
        />
      )}
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

function FoodRow({
  food,
  selected,
  onClick,
}: {
  food: FoodLite;
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
        <span className="text-sm font-medium">{food.name}</span>
        {food.name_hi && (
          <span
            className={`text-xs ${
              selected ? "text-zinc-300" : "text-zinc-400"
            }`}
          >
            {food.name_hi}
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
