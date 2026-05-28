import Link from "next/link";
import { requireFamily } from "@/lib/auth";
import { BottomNav } from "./bottom-nav";

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
          <div className="flex items-center gap-3">
            <Link
              href="/v2/planner"
              className="text-base font-semibold tracking-tight text-black"
            >
              Menu Planner
            </Link>
            <div className="inline-flex rounded-full border border-zinc-200 p-0.5 text-[11px] font-medium">
              <Link
                href="/planner"
                className="rounded-full px-2 py-0.5 text-zinc-500 hover:text-black"
              >
                v1
              </Link>
              <span className="rounded-full bg-black px-2 py-0.5 text-white">
                v2
              </span>
            </div>
          </div>
          <div className="hidden items-center gap-5 text-sm sm:flex">
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
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-10 sm:pb-10">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
