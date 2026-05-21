"use client";
import { useState, useTransition } from "react";
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

type Start = (cb: () => void) => void;

export function DayPlanner({
  dayPlanId,
  slots,
  allFoods,
}: {
  dayPlanId: number;
  slots: SlotWithFoods[];
  allFoods: FoodLite[];
}) {
  const [pending, start] = useTransition();
  const [newSlot, setNewSlot] = useState("");

  function add() {
    if (!newSlot.trim()) return;
    start(() => addSlot(dayPlanId, newSlot));
    setNewSlot("");
  }

  return (
    <div className="space-y-4">
      {slots.length === 0 && (
        <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-400">
          No slots for this day. Add one below, or set up defaults in Settings.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot, i) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            first={i === 0}
            last={i === slots.length - 1}
            allFoods={allFoods}
            dayPlanId={dayPlanId}
            pending={pending}
            start={start}
          />
        ))}
      </div>

      <div className="flex max-w-sm gap-2">
        <input
          value={newSlot}
          onChange={(e) => setNewSlot(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="New meal slot name…"
          className="input flex-1"
        />
        <button
          type="button"
          disabled={pending || !newSlot.trim()}
          onClick={add}
          className="btn btn-primary shrink-0"
        >
          Add slot
        </button>
      </div>
    </div>
  );
}

function SlotCard({
  slot,
  first,
  last,
  allFoods,
  dayPlanId,
  pending,
  start,
}: {
  slot: SlotWithFoods;
  first: boolean;
  last: boolean;
  allFoods: FoodLite[];
  dayPlanId: number;
  pending: boolean;
  start: Start;
}) {
  const used = new Set(slot.foods.map((f) => f.id));
  const available = allFoods.filter((f) => !used.has(f.id));

  return (
    <section
      className="flex flex-col rounded-lg border border-zinc-200"
      style={{ backgroundColor: slot.color }}
    >
      <div className="flex items-center gap-1.5 border-b border-black/10 p-2">
        <input
          type="color"
          defaultValue={slot.color}
          onChange={(e) => start(() => recolorSlot(slot.id, e.target.value))}
          className="h-7 w-7 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
          aria-label="Slot colour"
        />
        <input
          defaultValue={slot.name}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== slot.name) start(() => renameSlot(slot.id, v));
          }}
          className="min-w-0 flex-1 rounded border border-transparent bg-white/70 px-2 py-1 text-sm font-semibold focus:border-zinc-300 focus:outline-none"
        />
        <button
          type="button"
          disabled={pending || first}
          onClick={() => start(() => moveSlot(dayPlanId, slot.id, -1))}
          className="rounded bg-white/70 px-1.5 py-1 text-xs disabled:opacity-30"
          aria-label="Move earlier"
        >
          ↑
        </button>
        <button
          type="button"
          disabled={pending || last}
          onClick={() => start(() => moveSlot(dayPlanId, slot.id, 1))}
          className="rounded bg-white/70 px-1.5 py-1 text-xs disabled:opacity-30"
          aria-label="Move later"
        >
          ↓
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm(`Remove the "${slot.name}" slot?`))
              start(() => deleteSlot(slot.id));
          }}
          className="rounded bg-white/70 px-1.5 py-1 text-xs text-zinc-500 hover:text-red-700"
          aria-label="Remove slot"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {slot.foods.length === 0 && (
          <p className="text-xs italic text-zinc-500">No foods yet.</p>
        )}
        <ul className="space-y-1">
          {slot.foods.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-2 rounded bg-white/70 px-2 py-1 text-sm"
            >
              <span className="min-w-0 truncate">
                {f.name}
                {f.name_hi && (
                  <span className="ml-1 text-xs text-zinc-500">
                    {f.name_hi}
                  </span>
                )}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => start(() => removeFood(slot.id, f.id))}
                className="shrink-0 text-zinc-400 hover:text-red-700"
                aria-label={`Remove ${f.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        {available.length > 0 && (
          <select
            value=""
            disabled={pending}
            onChange={(e) => {
              if (e.target.value)
                start(() => addFood(slot.id, e.target.value));
            }}
            className="mt-auto rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">+ Add food…</option>
            {available.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </section>
  );
}
