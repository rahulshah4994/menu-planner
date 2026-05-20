import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { fillEmptySlotsAcrossRange } from "@/lib/randomiser/daily-fill";
import { formatISODate } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * Daily deadline auto-fill. Schedule via vercel.json crons.
 *
 * Auth:
 *   - Production (Vercel cron): sends `Authorization: Bearer <CRON_SECRET>`
 *   - Manual trigger: GET /api/cron/deadline-fill?secret=<CRON_SECRET>
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  const auth = req.headers.get("authorization");
  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");
  if (
    auth !== `Bearer ${cronSecret}` &&
    querySecret !== cronSecret
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: settings, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error || !settings) {
    return NextResponse.json(
      { error: "settings not found", detail: error?.message },
      { status: 500 }
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startISO = formatISODate(today);

  // Fill the viewer horizon — that's what the cook will see tomorrow
  const days = settings.viewer_horizon_days ?? 3;
  const result = await fillEmptySlotsAcrossRange(
    supabase,
    settings,
    startISO,
    days
  );

  return NextResponse.json({
    ok: true,
    startDate: startISO,
    days,
    ...result,
  });
}
