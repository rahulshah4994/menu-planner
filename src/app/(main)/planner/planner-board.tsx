"use client";
import { startTransition, useEffect, useState, useTransition } from "react";
import {
  CircleNotch,
  ForkKnife,
  NotePencil,
  Plus,
  Rows,
  Shuffle,
  SquaresFour,
  Users,
} from "@phosphor-icons/react/dist/ssr";
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
  defaultPeople: number;
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
  defaultPeople,
}: BoardProps) {
  const [open, setOpen] = useState<{
    date: string;
    slotId: number;
  } | null>(null);
  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [busyRange, startRange] = useTransition();
  const [layout, setLayout] = useState<"horizontal" | "vertical">("vertical");

  useEffect(() => {
    const saved = localStorage.getItem("planner-layout");
    const next: "horizontal" | "vertical" =
      saved === "horizontal" || saved === "vertical"
        ? saved
        : typeof window !== "undefined" &&
          window.matchMedia("(min-width: 768px)").matches
        ? "horizontal"
        : "vertical";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration-safe read of the saved layout
    setLayout(next);
  }, []);
  useEffect(() => {
    localStorage.setItem("planner-layout", layout);
  }, [layout]);

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
      <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
        <div className="inline-flex rounded-md border border-zinc-300 p-0.5">
          <button
            type="button"
            onClick={() => setLayout("vertical")}
            aria-label="Stack days vertically"
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              layout === "vertical"
                ? "bg-black text-white"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            <Rows size={13} weight="bold" />
          </button>
          <button
            type="button"
            onClick={() => setLayout("horizontal")}
            aria-label="Scroll days horizontally"
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              layout === "horizontal"
                ? "bg-black text-white"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            <SquaresFour size={13} weight="bold" />
          </button>
        </div>
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

      <div
        className={
          layout === "horizontal"
            ? "flex gap-3 overflow-x-auto p-1 pb-4"
            : "flex flex-col gap-3 p-1 pb-4"
        }
      >
        {days.map((day) => (
          <DayColumn
            key={day.date}
            day={day}
            layout={layout}
            isToday={day.date === todayISO}
            defaultPeople={defaultPeople}
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
          defaultPeople={defaultPeople}
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
  layout,
  isToday,
  defaultPeople,
  onOpen,
  onAddSlot,
}: {
  day: PlannerDay;
  layout: "horizontal" | "vertical";
  isToday: boolean;
  defaultPeople: number;
  onOpen: (slotId: number) => void;
  onAddSlot: () => void;
}) {
  const [busy, startBusy] = useTransition();

  return (
    <section
      className={`flex flex-col rounded-lg border bg-white ${
        layout === "horizontal" ? "w-60 shrink-0" : "w-full"
      } ${
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
          <SlotCell
            key={slot.id}
            slot={slot}
            defaultPeople={defaultPeople}
            onOpen={() => onOpen(slot.id)}
          />
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
  defaultPeople,
  onOpen,
}: {
  slot: SlotWithFoods;
  defaultPeople: number;
  onOpen: () => void;
}) {
  const bg = hexAlpha(slot.color, 0.18);
  const border = hexAlpha(slot.color, 0.55);
  const isEmpty = slot.foods.length === 0;
  const peopleCount = slot.people_eating ?? defaultPeople;
  const peopleOverride =
    slot.people_eating !== null && slot.people_eating !== defaultPeople;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full rounded-md border p-2 text-left transition-colors hover:brightness-95"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-700">
          {slot.name}
        </span>
      </div>
      <div className="mt-1">
        {slot.eating_out ? (
          <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-300">
            <ForkKnife size={12} weight="bold" />
            Eating out
          </span>
        ) : isEmpty ? (
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
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <span
          className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
            peopleOverride
              ? "bg-amber-100 text-amber-900 ring-1 ring-amber-400"
              : "bg-white/70 text-zinc-600 ring-1 ring-zinc-300"
          }`}
          title={
            peopleOverride
              ? `${peopleCount} eating (default ${defaultPeople})`
              : `${peopleCount} eating`
          }
        >
          <Users size={11} weight="bold" />
          {peopleCount}
        </span>
        {slot.notes && (
          <span
            className="inline-flex max-w-full items-center gap-0.5 truncate rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900 ring-1 ring-amber-300"
            title={slot.notes}
          >
            <NotePencil size={11} weight="bold" />
            <span className="truncate">{slot.notes}</span>
          </span>
        )}
      </div>
    </button>
  );
}
