import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { addDays, formatISODate, rangeDays } from "@/lib/dates";
import { ViewerMenu, type ViewerPlan } from "./viewer-menu";

export const dynamic = "force-dynamic";

export default async function ViewerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

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
  const startISO = formatISODate(today);
  const endISO = formatISODate(addDays(today, days));

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
  const dates = rangeDays(today, days).map((d) => formatISODate(d));

  return (
    <ViewerMenu
      dates={dates}
      plans={plans}
      householdSize={settings.household_size}
    />
  );
}
