"use client";
import { useState, useTransition } from "react";
import { CircleNotch, Shuffle } from "@phosphor-icons/react/dist/ssr";
import { parseISODate } from "@/lib/dates";
import { mealTypeColor } from "@/lib/meal-colors";
import { randomiseDay, randomiseSlot } from "./actions";
import { SlotEditor } from "./slot-editor";
import {
  SLOTS,
  type AddonCategory,
  type AddonLite,
  type MealLite,
  type PlanState,
  type Slot,
} from "./types";

interface BoardProps {
  dates: string[];
  todayISO: string;
  slotPlans: Record<string, PlanState>;
  mealsByType: Record<Slot, MealLite[]>;
  addonsByCategory: Record<AddonCategory, AddonLite[]>;
}

function dayLabel(iso: string) {
  return parseISODate(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function PlannerBoard({
  dates,
  todayISO,
  slotPlans,
  mealsByType,
  addonsByCategory,
}: BoardProps) {
  const [open, setOpen] = useState<{ date: string; slot: Slot } | null>(null);

  return (
    <>
      <div className="flex gap-3 overflow-x-auto p-1 pb-4">
        {dates.map((iso) => (
          <DayColumn
            key={iso}
            iso={iso}
            isToday={iso === todayISO}
            slotPlans={slotPlans}
            onOpen={(slot) => setOpen({ date: iso, slot })}
          />
        ))}
      </div>

      {open && (
        <SlotEditor
          date={open.date}
          slot={open.slot}
          plan={slotPlans[`${open.date}|${open.slot}`]}
          meals={mealsByType[open.slot]}
          addonsByCategory={addonsByCategory}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

function DayColumn({
  iso,
  isToday,
  slotPlans,
  onOpen,
}: {
  iso: string;
  isToday: boolean;
  slotPlans: Record<string, PlanState>;
  onOpen: (slot: Slot) => void;
}) {
  const [busy, startBusy] = useTransition();

  return (
    <section
      className={`flex w-60 shrink-0 flex-col rounded-lg border bg-white ${
        isToday
          ? "border-emerald-400 ring-2 ring-emerald-400/30"
          : "border-zinc-200"
      }`}
    >
      <div
        className={`flex items-center justify-between gap-2 rounded-t-lg border-b px-3 py-2 ${
          isToday
            ? "border-emerald-200 bg-emerald-50"
            : "border-zinc-200 bg-zinc-50"
        }`}
      >
        <h2
          className={`flex items-center gap-1.5 text-sm font-semibold ${
            isToday ? "text-emerald-800" : "text-black"
          }`}
        >
          {dayLabel(iso)}
          {isToday && (
            <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
              Today
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={() => startBusy(async () => void (await randomiseDay(iso)))}
          disabled={busy}
          aria-label="Randomise day"
          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-black disabled:opacity-60"
        >
          {busy ? (
            <CircleNotch size={15} weight="bold" className="animate-spin" />
          ) : (
            <Shuffle size={15} weight="bold" />
          )}
        </button>
      </div>
      <div className="flex flex-col gap-2 p-2">
        {SLOTS.map((slot) => (
          <SlotCell
            key={slot}
            iso={iso}
            slot={slot}
            plan={slotPlans[`${iso}|${slot}`]}
            onOpen={onOpen}
          />
        ))}
      </div>
    </section>
  );
}

function SlotCell({
  iso,
  slot,
  plan,
  onOpen,
}: {
  iso: string;
  slot: Slot;
  plan: PlanState;
  onOpen: (slot: Slot) => void;
}) {
  const [busy, startBusy] = useTransition();
  const c = mealTypeColor(slot);
  const isEmpty =
    plan.meals.length === 0 && plan.addons.length === 0 && !plan.eating_out;

  return (
    <div className={`rounded-md border p-2 ${c.bg} ${c.border}`}>
      <div className="flex items-center justify-between">
        <span
          className={`text-[11px] font-semibold uppercase tracking-wide ${c.heading}`}
        >
          {slot}
        </span>
        <button
          type="button"
          onClick={() =>
            startBusy(async () => void (await randomiseSlot(iso, slot)))
          }
          disabled={busy}
          aria-label={`Randomise ${slot}`}
          className="rounded p-1 text-zinc-500 hover:bg-white/70 hover:text-black disabled:opacity-60"
        >
          {busy ? (
            <CircleNotch size={13} weight="bold" className="animate-spin" />
          ) : (
            <Shuffle size={13} weight="bold" />
          )}
        </button>
      </div>
      <button
        type="button"
        onClick={() => onOpen(slot)}
        className="mt-1 block w-full text-left"
      >
        {plan.eating_out ? (
          <span className="text-xs text-zinc-600">🍽 Eating out</span>
        ) : isEmpty ? (
          <span className="text-xs italic text-zinc-400">+ Tap to plan</span>
        ) : (
          <div className="space-y-0.5">
            {plan.meals.map((m) => (
              <p key={m.id} className="text-xs font-medium text-zinc-800">
                {m.name_en}
              </p>
            ))}
            {plan.addons.map((a) => (
              <p key={a.id} className="text-[11px] text-zinc-500">
                + {a.name_en}
              </p>
            ))}
          </div>
        )}
      </button>
      {(plan.guests > 0 || plan.today_note) && (
        <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-500">
          {plan.guests > 0 && <span>👥 +{plan.guests}</span>}
          {plan.today_note && <span title={plan.today_note}>📝</span>}
        </div>
      )}
    </div>
  );
}
