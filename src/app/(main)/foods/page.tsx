import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Food } from "@/lib/v2/types";
import { FoodsTable } from "./foods-table";

export default async function FoodsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("foods").select("*").order("name");
  const foods = (data ?? []) as Food[];

  return (
    <main>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-black">
            Foods
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            The catalog you fill meal slots from.
          </p>
        </div>
        <Link href="/foods/new" className="btn btn-primary">
          New food
        </Link>
      </header>

      <FoodsTable foods={foods} />
    </main>
  );
}
