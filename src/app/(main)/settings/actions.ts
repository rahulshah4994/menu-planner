"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomBytes } from "crypto";

const SETTINGS = "/settings";

const settingsSchema = z.object({
  planning_horizon_days: z.coerce.number().int().min(1).max(60),
  viewer_horizon_days: z.coerce.number().int().min(1).max(14),
  deadline_time: z.string().regex(/^\d{2}:\d{2}$/),
  household_size: z.coerce.number().int().min(1).max(50),
  no_repeat_days_breakfast: z.coerce.number().int().min(0).max(30),
  no_repeat_days_lunch: z.coerce.number().int().min(0).max(30),
  no_repeat_days_dinner: z.coerce.number().int().min(0).max(30),
});

export async function updateSettings(fd: FormData) {
  const parsed = settingsSchema.parse({
    planning_horizon_days: fd.get("planning_horizon_days"),
    viewer_horizon_days: fd.get("viewer_horizon_days"),
    deadline_time: fd.get("deadline_time"),
    household_size: fd.get("household_size"),
    no_repeat_days_breakfast: fd.get("no_repeat_days_breakfast"),
    no_repeat_days_lunch: fd.get("no_repeat_days_lunch"),
    no_repeat_days_dinner: fd.get("no_repeat_days_dinner"),
  });
  const time = `${parsed.deadline_time}:00`;
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({ ...parsed, deadline_time: time })
    .eq("id", 1);
  if (error) throw error;
  revalidatePath(SETTINGS);
}

export async function rotateCookToken() {
  const supabase = await createClient();
  await supabase
    .from("cook_tokens")
    .update({ revoked: true })
    .eq("revoked", false);

  const token = randomBytes(24).toString("base64url");
  const { error } = await supabase
    .from("cook_tokens")
    .insert({ token, label: "primary" });
  if (error) throw error;
  revalidatePath(SETTINGS);
}

export async function revokeAllCookTokens() {
  const supabase = await createClient();
  await supabase
    .from("cook_tokens")
    .update({ revoked: true })
    .eq("revoked", false);
  revalidatePath(SETTINGS);
}

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
