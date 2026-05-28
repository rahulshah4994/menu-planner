"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const SETTINGS = "/v2/settings";

export async function addSlotTemplate(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const supabase = await createClient();
  const { data } = await supabase
    .from("slot_templates")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = ((data?.position as number | undefined) ?? 0) + 1;
  await supabase
    .from("slot_templates")
    .insert({ name: trimmed, color: "#e5e7eb", position });
  revalidatePath(SETTINGS);
}

export async function renameSlotTemplate(id: string, name: string) {
  const supabase = await createClient();
  await supabase
    .from("slot_templates")
    .update({ name: name.trim() || "Untitled" })
    .eq("id", id);
  revalidatePath(SETTINGS);
}

export async function recolorSlotTemplate(id: string, color: string) {
  const supabase = await createClient();
  await supabase.from("slot_templates").update({ color }).eq("id", id);
  revalidatePath(SETTINGS);
}

export async function deleteSlotTemplate(id: string) {
  const supabase = await createClient();
  await supabase.from("slot_templates").delete().eq("id", id);
  revalidatePath(SETTINGS);
}

/** Swap a template's position with its neighbour in the given direction. */
export async function moveSlotTemplate(id: string, dir: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("slot_templates")
    .select("id, position")
    .order("position");
  const list = (data ?? []) as { id: string; position: number }[];
  const i = list.findIndex((t) => t.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  const a = list[i];
  const b = list[j];
  await supabase
    .from("slot_templates")
    .update({ position: b.position })
    .eq("id", a.id);
  await supabase
    .from("slot_templates")
    .update({ position: a.position })
    .eq("id", b.id);
  revalidatePath(SETTINGS);
}
