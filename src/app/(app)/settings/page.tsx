import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import {
  updateSettings,
  rotateCookToken,
  revokeAllCookTokens,
} from "./actions";
import { CookUrlCard } from "./cook-url-card";

export default async function SettingsPage() {
  const settings = await getSettings();
  const supabase = await createClient();
  const { data: tokenRow } = await supabase
    .from("cook_tokens")
    .select("token")
    .eq("revoked", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "http";
  const host = hdrs.get("host") ?? "localhost:3000";
  const cookUrl = tokenRow?.token
    ? `${proto}://${host}/viewer/${tokenRow.token}`
    : null;

  // strip seconds from deadline_time for the time input
  const deadlineHHMM = settings.deadline_time.slice(0, 5);

  return (
    <main className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-black">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Defaults for the randomiser, planning horizons, and cook access.
        </p>
      </header>

      <CookUrlCard
        url={cookUrl}
        rotate={rotateCookToken}
        revoke={revokeAllCookTokens}
      />

      <section className="border border-zinc-200 p-5">
        <h2 className="text-lg font-semibold tracking-tight text-black">
          Horizons & defaults
        </h2>
        <form action={updateSettings} className="mt-4 grid max-w-2xl gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Planning horizon (days)">
              <input
                name="planning_horizon_days"
                type="number"
                min={1}
                max={60}
                defaultValue={settings.planning_horizon_days}
                className="input"
              />
            </Field>
            <Field label="Viewer horizon (days)">
              <input
                name="viewer_horizon_days"
                type="number"
                min={1}
                max={14}
                defaultValue={settings.viewer_horizon_days}
                className="input"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Deadline time (auto-fill at)">
              <input
                name="deadline_time"
                type="time"
                defaultValue={deadlineHHMM}
                className="input"
              />
            </Field>
            <Field label="Household size">
              <input
                name="household_size"
                type="number"
                min={1}
                max={50}
                defaultValue={settings.household_size}
                className="input"
              />
            </Field>
          </div>

          <h3 className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            No-repeat window per slot
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Breakfast">
              <input
                name="no_repeat_days_breakfast"
                type="number"
                min={0}
                max={30}
                defaultValue={settings.no_repeat_days_breakfast}
                className="input"
              />
            </Field>
            <Field label="Lunch">
              <input
                name="no_repeat_days_lunch"
                type="number"
                min={0}
                max={30}
                defaultValue={settings.no_repeat_days_lunch}
                className="input"
              />
            </Field>
            <Field label="Dinner">
              <input
                name="no_repeat_days_dinner"
                type="number"
                min={0}
                max={30}
                defaultValue={settings.no_repeat_days_dinner}
                className="input"
              />
            </Field>
          </div>

          <div className="pt-2">
            <button type="submit" className="btn btn-primary">
              Save settings
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-700">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
