// Lightweight date utilities — no library.
// All "date" values in this app are ISO date strings (YYYY-MM-DD), no time.

export function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  return new Date(`${s}T00:00:00`);
}

/** Returns Monday of the week containing `d` (in local time). */
export function startOfWeek(d: Date): Date {
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // Mon=0
  result.setDate(result.getDate() - diff);
  return result;
}

export function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

export function rangeDays(start: Date, days: number): Date[] {
  return Array.from({ length: days }, (_, i) => addDays(start, i));
}

export function formatDayLabel(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function formatWeekRangeLabel(start: Date, days: number): string {
  const end = addDays(start, days - 1);
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    const month = start.toLocaleDateString("en-US", { month: "short" });
    return `${month} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}
