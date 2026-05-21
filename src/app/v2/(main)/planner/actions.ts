"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { slotId } from "@/lib/v2/ids";

const PLANNER = "/v2/planner";

export async function addSlot(dayPlanId: number, name: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("day_slots")
    .select("slot_no, position")
    .eq("day_plan_id", dayPlanId);
  const rows = (data ?? []) as { slot_no: number; position: number }[];
  const slotNo = rows.reduce((m, r) => Math.max(m, r.slot_no), 0) + 1;
  const position = rows.reduce((m, r) => Math.max(m, r.position), 0) + 1;
  const { error } = await supabase.from("day_slots").insert({
    id: slotId(dayPlanId, slotNo),
    day_plan_id: dayPlanId,
    slot_no: slotNo,
    name: name.trim() || "New meal",
    color: "#e5e7eb",
    position,
  });
  if (error) throw error;
  revalidatePath(PLANNER);
}

export async function renameSlot(id: number, name: string) {
  const supabase = await createClient();
  await supabase
    .from("day_slots")
    .update({ name: name.trim() || "Untitled" })
    .eq("id", id);
  revalidatePath(PLANNER);
}

export async function recolorSlot(id: number, color: string) {
  const supabase = await createClient();
  await supabase.from("day_slots").update({ color }).eq("id", id);
  revalidatePath(PLANNER);
}

export async function deleteSlot(id: number) {
  const supabase = await createClient();
  await supabase.from("day_slots").delete().eq("id", id);
  revalidatePath(PLANNER);
}

/** Swap a slot's position with its neighbour in the given direction. */
export async function moveSlot(dayPlanId: number, id: number, dir: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("day_slots")
    .select("id, position")
    .eq("day_plan_id", dayPlanId)
    .order("position");
  const list = (data ?? []) as { id: number; position: number }[];
  const i = list.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  const a = list[i];
  const b = list[j];
  await supabase
    .from("day_slots")
    .update({ position: b.position })
    .eq("id", a.id);
  await supabase
    .from("day_slots")
    .update({ position: a.position })
    .eq("id", b.id);
  revalidatePath(PLANNER);
}

export async function addFood(daySlotId: number, foodId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("day_slot_foods")
    .select("position")
    .eq("day_slot_id", daySlotId);
  const position =
    (data ?? []).reduce(
      (m: number, r: { position: number }) => Math.max(m, r.position),
      -1
    ) + 1;
  const { error } = await supabase
    .from("day_slot_foods")
    .upsert({ day_slot_id: daySlotId, food_id: foodId, position });
  if (error) throw error;
  revalidatePath(PLANNER);
}

export async function removeFood(daySlotId: number, foodId: string) {
  const supabase = await createClient();
  await supabase
    .from("day_slot_foods")
    .delete()
    .eq("day_slot_id", daySlotId)
    .eq("food_id", foodId);
  revalidatePath(PLANNER);
}
