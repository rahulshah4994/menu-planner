"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarBlank,
  BowlFood,
  Gear,
} from "@phosphor-icons/react/dist/ssr";

const ITEMS = [
  { href: "/planner", label: "Planner", Icon: CalendarBlank },
  { href: "/foods", label: "Foods", Icon: BowlFood },
  { href: "/settings", label: "Settings", Icon: Gear },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {ITEMS.map(({ href, label, Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                active ? "text-black" : "text-zinc-400"
              }`}
            >
              <Icon size={22} weight={active ? "fill" : "regular"} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
