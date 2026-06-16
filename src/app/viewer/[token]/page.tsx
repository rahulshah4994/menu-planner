import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { addDays, formatISODate, parseISODate, rangeDays } from "@/lib/dates";
import { dayPlanId, slotId } from "@/lib/v2/ids";
import type { DaySlot, SlotTemplate } from "@/lib/v2/types";
import { ViewerMenu, type ViewerDay, type ViewerFood } from "./viewer-menu";

export const dynamic = "force-dynamic";

export default async function V2ViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ start?: string }>;
}) {
  const { token } = await params;
  const { start } = await searchParams;

  const supabase = createServiceClient();
  const { data: tok } = await supabase
    .from("cook_tokens")
    .select("token, revoked, family_id")
    .eq("token", token)
    .maybeSingle();
  if (!tok || tok.revoked) notFound();
  const familyId = tok.family_id as string;

  // Service-role client bypasses RLS, so scope every query to this family.
  const { data: settingsRow } = await supabase
    .from("settings")
    .select("*")
    .eq("family_id", familyId)
    .maybeSingle();
  const settings = settingsRow ?? {
    viewer_horizon_days: 3,
    household_size: 2,
  };

  const horizon = settings.viewer_horizon_days ?? 3;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = formatISODate(today);

  const validStart =
    start && /^\d{4}-\d{2}-\d{2}$/.test(start) ? start : undefined;
  const base = validStart ? parseISODate(validStart) : today;
  const dates = rangeDays(base, horizon).map((d) => formatISODate(d));
  const prevStart = formatISODate(addDays(base, -horizon));
  const nextStart = formatISODate(addDays(base, horizon));

  const planIds = dates.map((d) => dayPlanId(d));

  const [{ data: slotData }, { data: tplData }] = await Promise.all([
    supabase
      .from("day_slots")
      .select("*")
      .eq("family_id", familyId)
      .in("day_plan_id", planIds)
      .order("position"),
    supabase
      .from("slot_templates")
      .select("*")
      .eq("family_id", familyId)
      .order("position"),
  ]);

  const slotsByPlan = new Map<number, DaySlot[]>();
  for (const s of (slotData ?? []) as DaySlot[]) {
    const arr = slotsByPlan.get(s.day_plan_id) ?? [];
    arr.push(s);
    slotsByPlan.set(s.day_plan_id, arr);
  }

  const allSlotIds = ((slotData ?? []) as DaySlot[]).map((s) => s.id);
  const foodsBySlot = new Map<number, ViewerFood[]>();
  if (allSlotIds.length) {
    const { data: sf } = await supabase
      .from("day_slot_foods")
      .select(
        "day_slot_id, position, food:foods(id,name,name_hi,ingredients,ingredients_hi,recipe_url)"
      )
      .eq("family_id", familyId)
      .in("day_slot_id", allSlotIds)
      .order("position");
    for (const r of (sf ?? []) as unknown as {
      day_slot_id: number;
      food: ViewerFood | null;
    }[]) {
      if (!r.food) continue;
      const arr = foodsBySlot.get(r.day_slot_id) ?? [];
      arr.push(r.food);
      foodsBySlot.set(r.day_slot_id, arr);
    }
  }

  const templates = (tplData ?? []) as SlotTemplate[];

  const days: ViewerDay[] = dates.map((date) => {
    const id = dayPlanId(date);
    const planned = slotsByPlan.get(id);
    if (planned && planned.length) {
      return {
        date,
        slots: planned.map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color,
          position: s.position,
          people_eating: s.people_eating,
          notes: s.notes,
          eating_out: s.eating_out,
          foods: foodsBySlot.get(s.id) ?? [],
        })),
      };
    }
    return {
      date,
      slots: templates.map((t, i) => ({
        id: slotId(id, i + 1),
        name: t.name,
        color: t.color,
        position: i + 1,
        people_eating: null,
        notes: "",
        eating_out: false,
        foods: [],
      })),
    };
  });

  return (
    <ViewerMenu
      dates={dates}
      days={days}
      todayISO={todayISO}
      token={token}
      prevStart={prevStart}
      nextStart={nextStart}
      defaultPeople={settings.household_size}
    />
  );
}
