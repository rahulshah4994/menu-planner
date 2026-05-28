"use client";
import { useState, useTransition } from "react";
import { Copy, ArrowsClockwise, Check } from "@phosphor-icons/react/dist/ssr";

export function CookUrlCard({
  url,
  rotate,
  revoke,
}: {
  url: string | null;
  rotate: () => Promise<void>;
  revoke: () => Promise<void>;
}) {
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="border border-zinc-200 p-5">
      <h2 className="text-lg font-semibold tracking-tight text-black">
        Cook&apos;s viewer URL
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        Bookmark this on your cook&apos;s phone. They see the menu in Hindi —
        no login. Rotate any time if it leaks.
      </p>

      {url ? (
        <div className="mt-4 flex items-center gap-2">
          <code className="flex-1 truncate border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">
            {url}
          </code>
          <button onClick={copy} className="btn btn-secondary">
            {copied ? <Check size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">No active token yet.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <form action={rotate} onSubmit={() => start(() => {})}>
          <button
            type="submit"
            disabled={pending}
            className="btn btn-secondary"
          >
            <ArrowsClockwise size={16} weight="bold" />
            {url ? "Rotate token" : "Generate cook URL"}
          </button>
        </form>
        {url && (
          <form
            action={revoke}
            onSubmit={(e) => {
              if (!confirm("Revoke all cook tokens? The cook will lose access until you regenerate.")) {
                e.preventDefault();
              }
            }}
          >
            <button type="submit" className="btn btn-secondary">
              Revoke
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
