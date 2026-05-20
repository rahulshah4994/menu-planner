"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomBytes } from "crypto";

const settingsSchema = z.object({
  planning_horizon_days: z.coerce.number().int().min(1).max(60),
  viewer_horizon_days: z.coerce.number().int().min(1).max(14),
  deadline_time: z.string().regex(/^\d{2}:\d{2}$/),
  household_size: z.coerce.number().int().min(1).max(50),
  no_repeat_days_breakfast: z.coerce.number().int().min(0).max(30),
  no_repeat_days_lunch: z.coerce.number().int().min(0).max(30),
  no_repeat_days_evening_snack: z.coerce.number().int().min(0).max(30),
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
    no_repeat_days_evening_snack: fd.get("no_repeat_days_evening_snack"),
    no_repeat_days_dinner: fd.get("no_repeat_days_dinner"),
  });
  // Persist as time-with-seconds for Postgres
  const time = `${parsed.deadline_time}:00`;
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({ ...parsed, deadline_time: time })
    .eq("id", 1);
  if (error) throw error;
  revalidatePath("/settings");
}

export async function rotateCookToken() {
  const supabase = await createClient();
  // Revoke existing active tokens
  await supabase
    .from("cook_tokens")
    .update({ revoked: true })
    .eq("revoked", false);

  // Mint a new urlsafe random token
  const token = randomBytes(24).toString("base64url");
  const { error } = await supabase
    .from("cook_tokens")
    .insert({ token, label: "primary" });
  if (error) throw error;
  revalidatePath("/settings");
}

export async function revokeAllCookTokens() {
  const supabase = await createClient();
  await supabase
    .from("cook_tokens")
    .update({ revoked: true })
    .eq("revoked", false);
  revalidatePath("/settings");
}
