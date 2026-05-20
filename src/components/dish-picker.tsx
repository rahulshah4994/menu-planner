"use client";
import { useState } from "react";
import { X } from "@phosphor-icons/react/dist/ssr";
import type { Dish } from "@/lib/db/types";

type DishLite = Pick<Dish, "id" | "name_en" | "name_hi" | "category">;

export function DishPicker({
  allDishes,
  selectedIds,
  onChange,
  name = "dish_ids",
}: {
  allDishes: DishLite[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  name?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = allDishes.filter(
    (d) =>
      d.name_en.toLowerCase().includes(query.toLowerCase()) ||
      d.name_hi.includes(query)
  );

  function toggle(id: string) {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  }

  return (
    <div>
      <input type="hidden" name={name} value={selectedIds.join(",")} />
      {selectedIds.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedIds.map((id) => {
            const d = allDishes.find((x) => x.id === id);
            if (!d) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-md bg-black px-2 py-1 text-xs text-white"
              >
                <span>{d.name_en}</span>
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="text-zinc-300 hover:text-white"
                  aria-label={`Remove ${d.name_en}`}
                >
                  <X size={12} weight="bold" />
                </button>
              </span>
            );
          })}
        </div>
      )}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search dishes…"
        className="input mb-2 text-sm"
      />
      <div className="max-h-56 overflow-y-auto rounded-md border border-zinc-200">
        {filtered.map((d) => (
          <label
            key={d.id}
            className="flex cursor-pointer items-center gap-2 border-b border-zinc-100 px-3 py-2 text-sm last:border-b-0 hover:bg-zinc-50"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(d.id)}
              onChange={() => toggle(d.id)}
            />
            <span>{d.name_en}</span>
            <span className="text-zinc-500">{d.name_hi}</span>
            <span className="ml-auto text-xs text-zinc-400">{d.category}</span>
          </label>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-sm text-zinc-500">No dishes match.</p>
        )}
      </div>
    </div>
  );
}
