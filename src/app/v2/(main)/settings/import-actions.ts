"use server";
import { revalidatePath } from "next/cache";
import { requireFamily } from "@/lib/auth";
import {
  importFoodsFromBuffer,
  type FoodsImportSummary,
} from "@/lib/v2/import";

export async function importFoods(
  _prev: FoodsImportSummary | null,
  fd: FormData
): Promise<FoodsImportSummary> {
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      error: "Please choose an .xlsx file.",
      foods: { inserted: 0, updated: 0, autofilled: 0 },
      warnings: [],
    };
  }

  const { supabase } = await requireFamily();
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const summary = await importFoodsFromBuffer(supabase, buf);
    revalidatePath("/v2/foods");
    revalidatePath("/v2/planner");
    return summary;
  } catch (e) {
    return {
      ok: false,
      error: `Could not read the file: ${(e as Error).message}`,
      foods: { inserted: 0, updated: 0, autofilled: 0 },
      warnings: [],
    };
  }
}
