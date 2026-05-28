// ID helpers for the parallel day-plan model.
//   day_plan id = year*1000 + day_of_year   (2026-01-01 -> 2026001)
//   day_slot id = `${dayPlanId}${slotNo}`    (slot 1 of 2026001 -> 20260011)

/** 1-based day of the year for an ISO date string (YYYY-MM-DD). */
export function dayOfYear(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1);
  return Math.round(ms / 86_400_000) + 1;
}

/** Numeric day-plan id for an ISO date string. */
export function dayPlanId(iso: string): number {
  return Number(iso.slice(0, 4)) * 1000 + dayOfYear(iso);
}

/** Numeric slot id — the day-plan id with the slot number appended. */
export function slotId(planId: number, slotNo: number): number {
  return Number(`${planId}${slotNo}`);
}

/** ISO date string (YYYY-MM-DD) for a numeric day-plan id. */
export function dateFromDayPlanId(id: number): string {
  const year = Math.floor(id / 1000);
  const doy = id % 1000;
  return new Date(Date.UTC(year, 0, doy)).toISOString().slice(0, 10);
}

/** Today's date as an ISO string in the server's local time. */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Shift an ISO date string by `delta` days. */
export function addDaysISO(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

/** Human label, e.g. "Wed, 21 May 2026". */
export function dateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
