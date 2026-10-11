// All dates in the app are "YYYY-MM-DD" strings in Asia/Dhaka time.
// Strings like this sort correctly, so plain < and > comparisons work.

const dhakaFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Dhaka",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}); // en-CA formats as YYYY-MM-DD

/** Today's date in Dhaka (or the Dhaka date of any moment). */
export function dhakaDate(now: Date = new Date()): string {
  return dhakaFormat.format(now);
}

/** Calendar math on a YYYY-MM-DD string; done in UTC so no DST/timezone surprises. */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from a to b (negative if b is earlier). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

/** The Sunday that starts this date's week. */
export function weekStart(date: string): string {
  return addDays(date, -new Date(`${date}T00:00:00Z`).getUTCDay());
}

const dhakaTimeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dhaka",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Current time in Dhaka as "HH:MM" (24-hour), comparable with schedule block times. */
export function dhakaTime(now: Date = new Date()): string {
  return dhakaTimeFormat.format(now);
}

/** "just now", "5 min ago", "3 h ago", "2 days ago". */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const min = Math.floor((now.getTime() - Date.parse(iso)) / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  if (min < 48 * 60) return `${Math.floor(min / 60)} h ago`;
  return `${Math.floor(min / 1440)} days ago`;
}
