"use client";
import { useState } from "react";
import { Plus } from "@phosphor-icons/react/dist/ssr";

/**
 * A creatable multi-select for tags. Every known tag is shown up-front as a
 * clickable toggle chip (no dropdown — one click to select/deselect). New
 * tags can be typed in below. Posts a comma-joined string under `name`.
 */
export function TagInput({
  name,
  value,
  onChange,
  suggestions,
  disabled,
}: {
  name: string;
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  disabled?: boolean;
}) {
  // Custom tags typed this session that aren't part of `suggestions` —
  // kept around so they stay visible even when toggled off.
  const [extra, setExtra] = useState<string[]>(() =>
    value.filter(
      (v) => !suggestions.some((s) => s.toLowerCase() === v.toLowerCase())
    )
  );
  const [draft, setDraft] = useState("");

  // All selectable tags, de-duplicated case-insensitively.
  const allTags: string[] = [];
  const seen = new Set<string>();
  for (const t of [...suggestions, ...extra]) {
    const k = t.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      allTags.push(t);
    }
  }

  const isSelected = (t: string) =>
    value.some((v) => v.toLowerCase() === t.toLowerCase());

  function toggle(t: string) {
    if (disabled) return;
    if (isSelected(t)) {
      onChange(value.filter((v) => v.toLowerCase() !== t.toLowerCase()));
    } else {
      onChange([...value, t]);
    }
  }

  function addNew() {
    const t = draft.trim();
    if (!t) return;
    if (!seen.has(t.toLowerCase())) setExtra((e) => [...e, t]);
    if (!isSelected(t)) onChange([...value, t]);
    setDraft("");
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-50" : ""}>
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((t) => {
            const sel = isSelected(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggle(t)}
                aria-pressed={sel}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  sel
                    ? "bg-black text-white"
                    : "border border-zinc-300 bg-white text-zinc-700 hover:border-black"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addNew();
            }
          }}
          disabled={disabled}
          placeholder="New tag…"
          autoComplete="off"
          className="input flex-1"
        />
        <button
          type="button"
          onClick={addNew}
          disabled={disabled || !draft.trim()}
          className="btn btn-secondary shrink-0"
        >
          <Plus size={14} weight="bold" />
          Add
        </button>
      </div>
      <input type="hidden" name={name} value={value.join(",")} />
    </div>
  );
}
