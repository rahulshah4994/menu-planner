"use client";
import { startTransition, useState, useTransition } from "react";
import { CircleNotch, Plus, Shuffle } from "@phosphor-icons/react/dist/ssr";
import { parseISODate } from "@/lib/dates";
import type { FoodLite, SlotWithFoods } from "@/lib/v2/types";
import { addSlot, randomizeDay, randomizeRange } from "./actions";
import { SlotEditor } from "./slot-editor";
import { SlotNameModal } from "./slot-name-modal";

export interface PlannerDay {
  date: string;
  planId: number;
  slots: SlotWithFoods[];
}

interface BoardProps {
  days: PlannerDay[];
  todayISO: string;
  allFoods: FoodLite[];
  rangeStart: string;
  rangeDays: number;
}

function dayLabel(iso: string) {
  return parseISODate(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function hexAlpha(hex: string, alpha: number) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function PlannerBoard({
  days,
  todayISO,
  allFoods,
  rangeStart,
  rangeDays,
}: BoardProps) {
  const [open, setOpen] = useState<{
    date: string;
    slotId: number;
  } | null>(null);
  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [busyRange, startRange] = useTransition();

  const openDay = open ? days.find((d) => d.date === open.date) ?? null : null;
  const openSlot =
    openDay && open
      ? openDay.slots.find((s) => s.id === open.slotId) ?? null
      : null;
  const addingDay = addingDate
    ? days.find((d) => d.date === addingDate) ?? null
    : null;

  return (
    <>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() =>
            startRange(async () => {
              await randomizeRange(rangeStart, rangeDays);
            })
          }
          disabled={busyRange}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-black hover:text-black disabled:opacity-60"
        >
          {busyRange ? (
            <CircleNotch size={13} weight="bold" className="animate-spin" />
          ) : (
            <Shuffle size={13} weight="bold" />
          )}
          Shuffle empty slots
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto p-1 pb-4">
        {days.map((day) => (
          <DayColumn
            key={day.date}
            day={day}
            isToday={day.date === todayISO}
            onOpen={(slotId) => setOpen({ date: day.date, slotId })}
            onAddSlot={() => setAddingDate(day.date)}
          />
        ))}
      </div>

      {openDay && openSlot && (
        <SlotEditor
          date={openDay.date}
          dayPlanId={openDay.planId}
          slot={openSlot}
          allSlots={openDay.slots}
          allFoods={allFoods}
          onClose={() => setOpen(null)}
        />
      )}

      {addingDay && (
        <SlotNameModal
          title={`Add slot · ${dayLabel(addingDay.date)}`}
          defaultValue="Snack"
          onCancel={() => setAddingDate(null)}
          onConfirm={(name) => {
            const planId = addingDay.planId;
            setAddingDate(null);
            startTransition(async () => {
              await addSlot(planId, name);
            });
          }}
        />
      )}
    </>
  );
}

function DayColumn({
  day,
  isToday,
  onOpen,
  onAddSlot,
}: {
  day: PlannerDay;
  isToday: boolean;
  onOpen: (slotId: number) => void;
  onAddSlot: () => void;
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
          {dayLabel(day.date)}
          {isToday && (
            <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
              Today
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={() =>
            startBusy(async () => {
              await randomizeDay(day.date);
            })
          }
          disabled={busy}
          aria-label="Shuffle empty slots for this day"
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
        {day.slots.map((slot) => (
          <SlotCell key={slot.id} slot={slot} onOpen={() => onOpen(slot.id)} />
        ))}
        {day.slots.length === 0 && (
          <p className="px-2 py-2 text-center text-xs italic text-zinc-400">
            No slots set up.
          </p>
        )}
        <button
          type="button"
          onClick={onAddSlot}
          className="flex items-center justify-center gap-1 rounded-md border border-dashed border-zinc-300 px-2 py-2 text-xs text-zinc-500 hover:border-black hover:text-black"
        >
          <Plus size={13} weight="bold" />
          Add slot
        </button>
      </div>
    </section>
  );
}

function SlotCell({
  slot,
  onOpen,
}: {
  slot: SlotWithFoods;
  onOpen: () => void;
}) {
  const bg = hexAlpha(slot.color, 0.18);
  const border = hexAlpha(slot.color, 0.55);
  const isEmpty = slot.foods.length === 0;

  return (
    <div
      className="rounded-md border p-2"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-700">
          {slot.name}
        </span>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="mt-1 block w-full text-left"
      >
        {isEmpty ? (
          <span className="text-xs italic text-zinc-400">+ Tap to plan</span>
        ) : (
          <div className="space-y-0.5">
            {slot.foods.map((f) => (
              <p key={f.id} className="text-xs font-medium text-zinc-800">
                {f.name}
              </p>
            ))}
          </div>
        )}
      </button>
    </div>
  );
}
