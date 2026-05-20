"use client";
import Link from "next/link";
import { PencilSimpleLine, Trash } from "@phosphor-icons/react/dist/ssr";

export function RowActions({
  editHref,
  deleteAction,
  itemLabel,
}: {
  editHref: string;
  deleteAction: () => Promise<void>;
  itemLabel: string;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={editHref}
        aria-label={`Edit ${itemLabel}`}
        className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
      >
        <PencilSimpleLine size={16} weight="bold" />
      </Link>
      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!confirm(`Archive ${itemLabel}? You can reactivate it later.`)) {
            e.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          aria-label={`Archive ${itemLabel}`}
          className="rounded p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600"
        >
          <Trash size={16} weight="bold" />
        </button>
      </form>
    </div>
  );
}
