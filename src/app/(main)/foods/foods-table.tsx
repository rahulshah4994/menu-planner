"use client";
import { useState } from "react";
import Link from "next/link";
import {
  PencilSimple,
  Archive,
  ArrowCounterClockwise,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr";
import type { Food } from "@/lib/v2/types";
import { archiveFood, unarchiveFood } from "./actions";
import { CategoryCell } from "./category-cell";

const PAGE_SIZE = 20;

export function FoodsTable({ foods }: { foods: Food[] }) {
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(0);

  const filtered = showArchived ? foods : foods.filter((f) => f.active);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const slice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleArchived(val: boolean) {
    setShowArchived(val);
    setPage(0);
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => toggleArchived(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
          />
          Show archived
        </label>
      </div>

      <div className="table-shell overflow-x-auto">
        <table className="table-base min-w-[40rem]">
          <thead>
            <tr>
              <th className="th-base">Name</th>
              <th className="th-base">Hindi</th>
              <th className="th-base">Categories</th>
              <th className="th-base"></th>
            </tr>
          </thead>
          <tbody>
            {slice.map((f) => (
              <tr key={f.id} className={f.active ? "" : "opacity-40"}>
                <td className="td-base font-medium text-black">{f.name}</td>
                <td className="td-base text-zinc-700">{f.name_hi}</td>
                <td className="td-base">
                  <CategoryCell categories={f.categories ?? []} />
                </td>
                <td className="td-base">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/foods/${f.id}`}
                      title="Edit"
                      className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-black"
                    >
                      <PencilSimple size={16} weight="bold" />
                    </Link>
                    {f.active ? (
                      <form action={archiveFood.bind(null, f.id)}>
                        <button
                          title="Archive"
                          className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-red-700"
                        >
                          <Archive size={16} weight="bold" />
                        </button>
                      </form>
                    ) : (
                      <form action={unarchiveFood.bind(null, f.id)}>
                        <button
                          title="Unarchive"
                          className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-emerald-700"
                        >
                          <ArrowCounterClockwise size={16} weight="bold" />
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-12 text-center text-zinc-500">
                  {showArchived ? "No foods found." : "No foods yet. Add your first one."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-600">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              className="rounded p-1.5 hover:bg-zinc-100 disabled:opacity-40"
              aria-label="Previous page"
            >
              <CaretLeft size={15} weight="bold" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
              className="rounded p-1.5 hover:bg-zinc-100 disabled:opacity-40"
              aria-label="Next page"
            >
              <CaretRight size={15} weight="bold" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
