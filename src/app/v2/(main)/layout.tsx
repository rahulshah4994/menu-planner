import Link from "next/link";
import { requireFamily } from "@/lib/auth";

export default async function V2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireFamily();
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-zinc-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/v2/planner"
            className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-black"
          >
            Menu Planner
            <span className="rounded bg-black px-1.5 py-0.5 text-[10px] font-medium text-white">
              v2
            </span>
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link
              href="/v2/planner"
              className="font-medium text-zinc-700 hover:text-black"
            >
              Planner
            </Link>
            <Link
              href="/v2/foods"
              className="font-medium text-zinc-700 hover:text-black"
            >
              Foods
            </Link>
            <Link
              href="/v2/settings"
              className="font-medium text-zinc-700 hover:text-black"
            >
              Settings
            </Link>
            <Link href="/planner" className="text-zinc-400 hover:text-black">
              ← v1
            </Link>
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </div>
    </div>
  );
}
