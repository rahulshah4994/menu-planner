"use client";
import { useState, useTransition } from "react";
import { Trash, Check } from "@phosphor-icons/react/dist/ssr";
import {
  toggleTicked,
  updateQuantity,
  deleteGroceryItem,
} from "./actions";

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string | null;
  notes: string | null;
  ticked: boolean;
}

export function GroceryRow({ item }: { item: GroceryItem }) {
  const [qty, setQty] = useState(item.quantity ?? "");
  const [pending, start] = useTransition();

  return (
    <div
      className={`flex items-center gap-3 border-b border-zinc-100 px-3 py-2.5 ${
        item.ticked ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => start(() => toggleTicked(item.id, !item.ticked))}
        disabled={pending}
        aria-label={item.ticked ? "Untick" : "Tick"}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
          item.ticked
            ? "border-black bg-black text-white"
            : "border-zinc-300 hover:border-black"
        }`}
      >
        {item.ticked && <Check size={14} weight="bold" />}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${
            item.ticked ? "text-zinc-500 line-through" : "text-black"
          }`}
        >
          {item.name}
        </p>
      </div>

      <input
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        onBlur={() => {
          if (qty !== (item.quantity ?? "")) {
            start(() => updateQuantity(item.id, qty));
          }
        }}
        placeholder="qty"
        className="input w-24 text-sm"
      />

      <form
        action={() => start(() => deleteGroceryItem(item.id))}
        onSubmit={(e) => {
          if (!confirm(`Delete "${item.name}" from the list?`)) {
            e.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          aria-label={`Delete ${item.name}`}
          className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash size={16} weight="bold" />
        </button>
      </form>
    </div>
  );
}
