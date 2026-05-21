import { createClient } from "@/lib/supabase/server";
import type { SlotTemplate } from "@/lib/v2/types";
import { SlotTemplates } from "./slot-templates";

export default async function V2SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("slot_templates")
    .select("*")
    .order("position");

  return (
    <main className="max-w-xl">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-black">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Default meal slots every new day is seeded with. Reorder with the
          arrows; pick a colour for each.
        </p>
      </header>
      <SlotTemplates templates={(data ?? []) as SlotTemplate[]} />
    </main>
  );
}
