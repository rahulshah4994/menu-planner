"use client";
import { startTransition, useEffect, useMemo, useState } from "react";
import {
  X,
  MagnifyingGlass,
  Check,
  Funnel,
  ForkKnife,
  NotePencil,
  Plus,
  Trash,
} from "@phosphor-icons/react/dist/ssr";
import { formatDayLabel, parseISODate } from "@/lib/dates";
import { mergeCategories } from "@/lib/v2/categories";
import type { FoodLite, SlotWithFoods } from "@/lib/v2/types";
import {
  addSlot,
  deleteSlot,
  moveSlot,
  saveSlot,
} from "./actions";
import { SlotNameModal } from "./slot-name-modal";

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
  defaultPeople,
  onClose,
}: {
  date: string;
  dayPlanId: number;
  slot: SlotWithFoods;
  allSlots: SlotWithFoods[];
  allFoods: FoodLite[];
  defaultPeople: number;
  onClose: () => void;
}) {
  // Local draft state — initialized from the slot prop once. Nothing here is
  // sent to the server until the user clicks Done; closing via X discards it.
  const [draftFoods, setDraftFoods] = useState<FoodLite[]>(slot.foods);
  const [draftPeople, setDraftPeople] = useState<number | null>(
    slot.people_eating
  );
  const [draftName, setDraftName] = useState(slot.name);
  const [draftColor, setDraftColor] = useState(slot.color);
  const [draftNotes, setDraftNotes] = useState(slot.notes ?? "");
  const [draftEatingOut, setDraftEatingOut] = useState(slot.eating_out);

  const [q, setQ] = useState("");
  const [addingSlot, setAddingSlot] = useState(false);
  const [notesOpen, setNotesOpen] = useState(!!slot.notes);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const peopleValue = draftPeople ?? defaultPeople;
  const isOverride = draftPeople !== null && draftPeople !== defaultPeople;

  const allCategories = useMemo(
    () => mergeCategories(allFoods.flatMap((f) => f.categories ?? [])),
    [allFoods]
  );

  function toggleCategory(cat: string) {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

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

  const selIds = new Set(draftFoods.map((f) => f.id));
  const bg = hexAlpha(draftColor, 0.18);
  const headingColor = "text-zinc-800";

  function toggle(food: FoodLite) {
    setDraftFoods((prev) =>
      prev.some((f) => f.id === food.id)
        ? prev.filter((f) => f.id !== food.id)
        : [...prev, food]
    );
  }

  async function commitDraft() {
    await saveSlot(slot.id, {
      name: draftName,
      color: draftColor,
      people_eating: draftPeople,
      notes: draftNotes,
      eating_out: draftEatingOut,
      foodIds: draftFoods.map((f) => f.id),
    });
  }

  function onDone() {
    if (saving) return;
    setSaving(true);
    startTransition(async () => {
      try {
        await commitDraft();
        onClose();
      } finally {
        setSaving(false);
      }
    });
  }

  function onMove(dir: number) {
    if (saving) return;
    setSaving(true);
    startTransition(async () => {
      try {
        await commitDraft();
        await moveSlot(dayPlanId, slot.id, dir);
      } finally {
        setSaving(false);
      }
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

  function onPeopleChange(next: number) {
    setDraftPeople(Math.max(0, Math.min(50, next)));
  }

  function onResetPeople() {
    setDraftPeople(null);
  }

  const idx = allSlots.findIndex((s) => s.id === slot.id);
  const canMoveUp = idx > 0;
  const canMoveDown = idx >= 0 && idx < allSlots.length - 1;

  const norm = q.trim().toLowerCase();
  const selectedCatsLower = new Set(
    Array.from(selectedCats).map((c) => c.trim().toLowerCase())
  );
  const matches = allFoods.filter((f) => {
    const nameOk =
      !norm ||
      f.name.toLowerCase().includes(norm) ||
      (f.name_hi ?? "").includes(q.trim());
    if (!nameOk) return false;
    if (selectedCatsLower.size === 0) return true;
    return (f.categories ?? []).some((c) =>
      selectedCatsLower.has(c.trim().toLowerCase())
    );
  });
  const slotKey = draftName.trim().toLowerCase();
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
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className={`w-full bg-transparent text-sm font-semibold uppercase tracking-wide outline-none ${headingColor}`}
            />
            <p className="mt-0.5 text-xs text-zinc-500">
              {formatDayLabel(parseISODate(date))}
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <input
                type="color"
                value={draftColor}
                onChange={(e) => setDraftColor(e.target.value)}
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
          <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 px-4 py-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draftEatingOut}
                onChange={(e) => setDraftEatingOut(e.target.checked)}
              />
              <ForkKnife size={14} weight="bold" className="text-zinc-500" />
              <span>Eating out</span>
            </label>
            <div
              className={`ml-auto flex items-center gap-2 rounded-md ${
                isOverride
                  ? "border border-amber-400 bg-amber-50 px-2 py-1"
                  : ""
              }`}
            >
              <span className="text-zinc-600">People</span>
              <button
                type="button"
                disabled={peopleValue <= 0}
                onClick={() => onPeopleChange(peopleValue - 1)}
                className="h-7 w-7 rounded-md border border-zinc-300 hover:bg-zinc-100 disabled:opacity-40"
              >
                −
              </button>
              <span
                className={`min-w-[2ch] text-center font-semibold ${
                  isOverride ? "text-amber-900" : "text-zinc-800"
                }`}
              >
                {peopleValue}
              </span>
              <button
                type="button"
                onClick={() => onPeopleChange(peopleValue + 1)}
                className="h-7 w-7 rounded-md border border-zinc-300 hover:bg-zinc-100"
              >
                +
              </button>
              {isOverride ? (
                <button
                  type="button"
                  onClick={onResetPeople}
                  title={`Reset to default (${defaultPeople})`}
                  className="text-xs font-medium text-amber-800 underline"
                >
                  reset
                </button>
              ) : (
                <span className="text-xs text-zinc-400">
                  default · {defaultPeople}
                </span>
              )}
            </div>
          </div>

          <div className="border-b border-zinc-100 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              {draftEatingOut ? (
                <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-300">
                  <ForkKnife size={12} weight="bold" />
                  Eating out
                </span>
              ) : draftFoods.length > 0 ? (
                draftFoods.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggle(f)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-black py-1.5 pl-3 pr-2 text-sm font-semibold text-white"
                  >
                    {f.name}
                    <X size={14} weight="bold" />
                  </button>
                ))
              ) : (
                <span className="text-xs italic text-zinc-400">
                  No foods picked yet
                </span>
              )}
              <button
                type="button"
                onClick={() => setNotesOpen((v) => !v)}
                aria-expanded={notesOpen}
                aria-label={notesOpen ? "Hide note" : "Add note"}
                className={`ml-auto inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                  draftNotes
                    ? "border-amber-500 bg-amber-50 text-amber-900"
                    : "border-zinc-300 text-zinc-600 hover:border-black hover:text-black"
                }`}
              >
                <NotePencil size={13} weight="bold" />
                Note
              </button>
            </div>
            {notesOpen && (
              <input
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
                placeholder="e.g. less spicy today"
                className="input mt-2"
                autoFocus
              />
            )}
          </div>

          {!draftEatingOut && (
            <>

              <div className="space-y-2 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
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
                  <button
                    type="button"
                    onClick={() => setFilterOpen((v) => !v)}
                    aria-label="Filter by category"
                    aria-expanded={filterOpen}
                    className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      filterOpen || selectedCats.size > 0
                        ? "border-black bg-black text-white"
                        : "border-zinc-300 text-zinc-600 hover:border-black hover:text-black"
                    }`}
                  >
                    <Funnel size={15} weight="bold" />
                    {selectedCats.size > 0 && !filterOpen && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                        {selectedCats.size}
                      </span>
                    )}
                  </button>
                </div>

                {filterOpen ? (
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                        Filter by category
                      </span>
                      <div className="flex items-center gap-2">
                        {selectedCats.size > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedCats(new Set())}
                            className="text-xs text-zinc-500 underline hover:text-black"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setFilterOpen(false)}
                          aria-label="Close filter"
                          className="rounded p-0.5 text-zinc-500 hover:bg-zinc-200 hover:text-black"
                        >
                          <X size={14} weight="bold" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {allCategories.map((cat) => {
                        const selected = selectedCats.has(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => toggleCategory(cat)}
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                              selected
                                ? "border-black bg-black text-white"
                                : "border-zinc-300 bg-white text-zinc-700 hover:border-black"
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  selectedCats.size > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(selectedCats).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className="inline-flex items-center gap-1 rounded-full border border-black bg-black py-0.5 pl-2.5 pr-1.5 text-xs font-medium text-white"
                        >
                          {cat}
                          <X size={11} weight="bold" />
                        </button>
                      ))}
                    </div>
                  )
                )}
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
                      <Section title={draftName || slot.name}>
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
            </>
          )}

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
            onClick={onDone}
            disabled={saving}
            className="btn btn-primary disabled:opacity-60"
          >
            {saving ? "Saving…" : "Done"}
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
            setSaving(true);
            startTransition(async () => {
              try {
                await commitDraft();
                await addSlot(dayPlanId, name);
              } finally {
                setSaving(false);
              }
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
