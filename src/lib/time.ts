// "HH:MM" helpers. No zod here, so the live Schedule clock can use them in the browser cheaply.

export type BlockState = "past" | "now" | "upcoming";

/** Where `time` falls against a block; "HH:MM" strings compare correctly as text. */
export function blockState(b: { start: string; end: string }, time: string): BlockState {
  return time >= b.end ? "past" : time >= b.start ? "now" : "upcoming";
}

/** "14:02" → 842 minutes after midnight. */
export const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Block length as "1h 30m", "2h" or "45m". */
export function duration(start: string, end: string): string {
  const m = minutes(end) - minutes(start);
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h && r ? `${h}h ${r}m` : h ? `${h}h` : `${r}m`;
}
