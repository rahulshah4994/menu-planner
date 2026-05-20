"use server";
import { revalidatePath } from "next/cache";
import { requireFamily } from "@/lib/auth";
import { importCatalogFromBuffer, type ImportSummary } from "@/lib/import/catalog";

export async function importCatalog(
  _prev: ImportSummary | null,
  fd: FormData
): Promise<ImportSummary> {
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      error: "Please choose an .xlsx file.",
      dishes: { inserted: 0, updated: 0 },
      meals: { inserted: 0, updated: 0 },
      warnings: [],
    };
  }

  const { supabase } = await requireFamily();
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const summary = await importCatalogFromBuffer(supabase, buf);
    revalidatePath("/dishes");
    revalidatePath("/meals");
    revalidatePath("/planner");
    return summary;
  } catch (e) {
    return {
      ok: false,
      error: `Could not read the file: ${(e as Error).message}`,
      dishes: { inserted: 0, updated: 0 },
      meals: { inserted: 0, updated: 0 },
      warnings: [],
    };
  }
}
