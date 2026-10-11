import { z } from "zod";
import { blockState } from "./time";

export type { BlockState } from "./time";

const Day = z.enum(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
export const DAYS = Day.options; // Sun→Sat, same order as Date.getUTCDay()
const Time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "expected HH:MM");
const Block = z
  .object({ start: Time, end: Time, label: z.string().min(1) })
  .refine((b) => b.end > b.start, "end must be after start"); // "HH:MM" strings sort correctly

// Shared by the seed script (validates the JSON) and the Schedule page (validates the DB row).
export const Schedule = z.object({
  class_days: z.array(Day),
  off_days: z.array(Day),
  class_day_blocks: z.array(Block),
  off_day_blocks: z.array(Block),
});
export type Schedule = z.infer<typeof Schedule>;

/** Today's plan: which kind of day `date` is and where `time` ("HH:MM") falls in its blocks. */
export function dayPlan(s: Schedule, date: string, time: string) {
  const day = DAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
  const kind = s.class_days.includes(day) ? "class" : s.off_days.includes(day) ? "off" : null;
  const blocks = kind === "class" ? s.class_day_blocks : kind === "off" ? s.off_day_blocks : [];
  return {
    day,
    kind,
    blocks: blocks.map((b) => ({ ...b, state: blockState(b, time) })),
  };
}
