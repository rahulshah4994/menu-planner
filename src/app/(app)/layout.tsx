import Link from "next/link";
import { SignOut } from "@phosphor-icons/react/dist/ssr";
import { requireFamily } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireFamily();
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-zinc-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-base font-semibold tracking-tight text-black"
          >
            Menu Planner
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/dishes"
              className="font-medium text-zinc-700 hover:text-black"
            >
              Dishes
            </Link>
            <Link
              href="/meals"
              className="font-medium text-zinc-700 hover:text-black"
            >
              Meals
            </Link>
            <Link
              href="/planner"
              className="font-medium text-zinc-700 hover:text-black"
            >
              Planner
            </Link>
            <Link
              href="/grocery"
              className="font-medium text-zinc-700 hover:text-black"
            >
              Grocery
            </Link>
            <Link
              href="/settings"
              className="font-medium text-zinc-700 hover:text-black"
            >
              Settings
            </Link>
            <form action="/logout" method="POST">
              <button
                aria-label="Sign out"
                className="flex items-center gap-1 text-zinc-500 hover:text-black"
              >
                <SignOut size={16} weight="bold" />
              </button>
            </form>
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
    </div>
  );
}
