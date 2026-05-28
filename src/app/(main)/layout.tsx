import Link from "next/link";
import { requireFamily } from "@/lib/auth";
import { BottomNav } from "./bottom-nav";

export default async function MainLayout({
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
            href="/planner"
            className="text-base font-semibold tracking-tight text-black"
          >
            Menu Planner
          </Link>
          <div className="hidden items-center gap-5 text-sm sm:flex">
            <Link
              href="/planner"
              className="font-medium text-zinc-700 hover:text-black"
            >
              Planner
            </Link>
            <Link
              href="/foods"
              className="font-medium text-zinc-700 hover:text-black"
            >
              Foods
            </Link>
            <Link
              href="/settings"
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
