"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  MagnifyingGlass,
  Check,
  Plus,
} from "@phosphor-icons/react/dist/ssr";

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

const ADDON_CATS = ["Beverage", "Side", "Salad", "Dessert"] as const;

export function AddSheet({
  open,
  onClose,
  slot,
  meals,
  addonsByCategory,
  selectedMealIds,
  selectedAddonIds,
  onToggleMeal,
  onToggleAddon,
}: {
  open: boolean;
  onClose: () => void;
  slot: string;
  meals: MealLite[];
  addonsByCategory: Record<(typeof ADDON_CATS)[number], DishLite[]>;
  selectedMealIds: Set<string>;
  selectedAddonIds: Set<string>;
  onToggleMeal: (meal: MealLite) => void;
  onToggleAddon: (dish: DishLite) => void;
}) {
  const [q, setQ] = useState("");

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    if (!open) {
      setQ("");
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const norm = q.trim().toLowerCase();
  const match = (it: { name_en: string; name_hi: string }) =>
    !norm ||
    it.name_en.toLowerCase().includes(norm) ||
    it.name_hi.includes(q.trim());

  const mealsF = meals.filter(match);
  const catGroups = ADDON_CATS.map((c) => ({
    cat: c,
    items: (addonsByCategory[c] ?? []).filter(match),
  })).filter((g) => g.items.length > 0);

  const nothing = mealsF.length === 0 && catGroups.length === 0;

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
        className="relative flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-h-[80vh] sm:max-w-md sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-black">
            Add to{" "}
            <span className="uppercase tracking-wide">{slot}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-black"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-zinc-100 p-3">
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-2">
          {nothing && (
            <div className="px-3 py-8 text-center text-sm text-zinc-400">
              {norm ? (
                <>No matches for “{q.trim()}”.</>
              ) : (
                <>Nothing in your database yet.</>
              )}
            </div>
          )}

          {mealsF.length > 0 && (
            <Section title="Meals">
              {mealsF.map((m) => (
                <Row
                  key={m.id}
                  name_en={m.name_en}
                  name_hi={m.name_hi}
                  selected={selectedMealIds.has(m.id)}
                  onClick={() => onToggleMeal(m)}
                />
              ))}
            </Section>
          )}

          {catGroups.map((g) => (
            <Section key={g.cat} title={`${g.cat}s`}>
              {g.items.map((d) => (
                <Row
                  key={d.id}
                  name_en={d.name_en}
                  name_hi={d.name_hi}
                  selected={selectedAddonIds.has(d.id)}
                  onClick={() => onToggleAddon(d)}
                />
              ))}
            </Section>
          ))}

          {/* Create links */}
          <div className="mt-2 flex gap-4 border-t border-zinc-100 px-3 py-3 text-xs">
            <Link
              href="/meals/new"
              className="font-medium text-black underline"
            >
              + New meal
            </Link>
            <Link
              href="/dishes/new"
              className="font-medium text-black underline"
            >
              + New dish
            </Link>
          </div>
        </div>

        {/* Footer (mobile) */}
        <div className="border-t border-zinc-200 p-3 sm:hidden">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary w-full justify-center"
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
        selected
          ? "bg-black text-white"
          : "text-black hover:bg-zinc-100"
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
