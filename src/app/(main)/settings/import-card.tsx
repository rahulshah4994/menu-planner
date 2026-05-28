"use client";
import { useActionState } from "react";
import { DownloadSimple, UploadSimple } from "@phosphor-icons/react/dist/ssr";
import { importFoods } from "./import-actions";

export function ImportCard() {
  const [state, formAction, pending] = useActionState(importFoods, null);

  return (
    <section className="border border-zinc-200 p-5">
      <h2 className="text-lg font-semibold tracking-tight text-black">
        Bulk import
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-zinc-500">
        Download the template, fill in the Foods sheet, then upload it. Foods
        are matched by English name — existing ones are updated, new ones are
        added. Blank Hindi name / Hindi ingredient cells are filled in
        automatically.
      </p>

      <a
        href="/api/import-template"
        download
        className="btn btn-secondary mt-4"
      >
        <DownloadSimple size={16} weight="bold" />
        Download template
      </a>

      <form
        action={formAction}
        className="mt-4 flex flex-wrap items-center gap-3"
      >
        <input
          type="file"
          name="file"
          accept=".xlsx"
          required
          className="text-sm file:mr-3 file:rounded-md file:border file:border-zinc-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:border-black"
        />
        <button type="submit" disabled={pending} className="btn btn-primary">
          <UploadSimple size={16} weight="bold" />
          {pending ? "Importing…" : "Upload & import"}
        </button>
      </form>

      {state && (
        <div className="mt-4 max-w-2xl">
          {state.error ? (
            <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              {state.error}
            </p>
          ) : (
            <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              <p className="font-medium">Import complete.</p>
              <p className="mt-0.5">
                Foods: {state.foods.inserted} added, {state.foods.updated}{" "}
                updated
                {state.foods.autofilled > 0
                  ? ` · ${state.foods.autofilled} auto-translated`
                  : ""}
              </p>
            </div>
          )}
          {state.warnings.length > 0 && (
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer font-medium text-amber-700">
                {state.warnings.length} warning
                {state.warnings.length > 1 ? "s" : ""}
              </summary>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-zinc-600">
                {state.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
