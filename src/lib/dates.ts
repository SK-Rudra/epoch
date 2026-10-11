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
