"use client";
import { useState, useTransition } from "react";
import type { SlotTemplate } from "@/lib/v2/types";
import {
  addSlotTemplate,
  deleteSlotTemplate,
  moveSlotTemplate,
  recolorSlotTemplate,
  renameSlotTemplate,
} from "./actions";

export function SlotTemplates({
  templates,
}: {
  templates: SlotTemplate[];
}) {
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState("");

  function add() {
    if (!draft.trim()) return;
    start(() => addSlotTemplate(draft));
    setDraft("");
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {templates.map((t, i) => (
          <li
            key={t.id}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2"
            style={{ backgroundColor: t.color }}
          >
            <input
              type="color"
              defaultValue={t.color}
              onChange={(e) =>
                start(() => recolorSlotTemplate(t.id, e.target.value))
              }
              className="h-8 w-8 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
              aria-label="Slot colour"
            />
            <input
              defaultValue={t.name}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== t.name)
                  start(() => renameSlotTemplate(t.id, v));
              }}
              className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white/80 px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              disabled={pending || i === 0}
              onClick={() => start(() => moveSlotTemplate(t.id, -1))}
              className="rounded-md border border-zinc-300 bg-white/80 px-2 py-1 text-sm disabled:opacity-30"
              aria-label="Move up"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={pending || i === templates.length - 1}
              onClick={() => start(() => moveSlotTemplate(t.id, 1))}
              className="rounded-md border border-zinc-300 bg-white/80 px-2 py-1 text-sm disabled:opacity-30"
              aria-label="Move down"
            >
              ↓
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (confirm(`Remove "${t.name}"?`))
                  start(() => deleteSlotTemplate(t.id));
              }}
              className="rounded-md border border-zinc-300 bg-white/80 px-2 py-1 text-sm text-zinc-500 hover:text-red-700"
              aria-label="Remove"
            >
              ✕
            </button>
          </li>
        ))}
        {templates.length === 0 && (
          <li className="rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-400">
            No default slots yet.
          </li>
        )}
      </ul>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="New slot name…"
          className="input flex-1"
        />
        <button
          type="button"
          disabled={pending || !draft.trim()}
          onClick={add}
          className="btn btn-primary shrink-0"
        >
          Add slot
        </button>
      </div>
    </div>
  );
}
