import { z } from "zod";

const Day = z.enum(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
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
