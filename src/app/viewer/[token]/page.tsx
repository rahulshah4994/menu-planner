import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { addDays, formatISODate, parseISODate, rangeDays } from "@/lib/dates";
import { ViewerMenu, type ViewerPlan } from "./viewer-menu";

export const dynamic = "force-dynamic";

export default async function ViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ start?: string }>;
}) {
  const { token } = await params;
  const { start } = await searchParams;

  // Validate token with service client (bypasses RLS)
  const supabase = createServiceClient();
  const { data: tokenRow } = await supabase
    .from("cook_tokens")
    .select("token, revoked")
    .eq("token", token)
    .maybeSingle();
  if (!tokenRow || tokenRow.revoked) notFound();

  const settings = await getSettings().catch(async () => {
    // settings table is RLS-protected; fall back via service client
    const { data } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();
    return data!;
  });

  const days = settings.viewer_horizon_days ?? 3;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = formatISODate(today);

  // `start` lets the cook page through past/future windows.
  const validStart =
    start && /^\d{4}-\d{2}-\d{2}$/.test(start) ? start : undefined;
  const base = validStart ? parseISODate(validStart) : today;

  const startISO = formatISODate(base);
  const endISO = formatISODate(addDays(base, days));

  const { data: plansData } = await supabase
    .from("meal_plans")
    .select(
      `id, date, slot, eating_out, guests, today_note,
       meal_plan_meals (
         meal_id, position,
         meal:meals (
           id, name_en, name_hi,
           meal_dishes (
             position,
             dish:dishes (id, name_en, name_hi, ingredients, ingredients_hi, recipe_url)
           )
         )
       ),
       meal_plan_addons (
         dish_id,
         dish:dishes (id, name_en, name_hi, ingredients, ingredients_hi, recipe_url, category)
       )`
    )
    .gte("date", startISO)
    .lt("date", endISO)
    .order("date", { ascending: true });

  const plans = (plansData ?? []) as unknown as ViewerPlan[];
  const dates = rangeDays(base, days).map((d) => formatISODate(d));
  const prevStart = formatISODate(addDays(base, -days));
  const nextStart = formatISODate(addDays(base, days));

  return (
    <ViewerMenu
      dates={dates}
      plans={plans}
      householdSize={settings.household_size}
      todayISO={todayISO}
      token={token}
      prevStart={prevStart}
      nextStart={nextStart}
    />
  );
}
