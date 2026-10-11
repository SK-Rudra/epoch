"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { dhakaDate } from "@/lib/dates";
import { requireUser } from "@/lib/supabase/server";

export type LogState = { saved?: boolean; error?: string };

// Same limits as the daily_logs checks in supabase/migrations/0001_init.sql.
const logSchema = z.object({
  study_hours: z.coerce.number().min(0).max(24),
  leetcode_solved: z.coerce.number().int().min(0).max(100),
  ielts_minutes: z.coerce.number().int().min(0).max(1440),
  workout: z.boolean(),
  note: z.string().trim().max(500),
});

export async function saveTodayLog(_prev: LogState, formData: FormData): Promise<LogState> {
  const parsed = logSchema.safeParse({
    ...Object.fromEntries(formData),
    workout: formData.get("workout") === "on", // unchecked boxes aren't sent at all
  });
  if (!parsed.success) return { error: "Check the numbers: hours 0–24, counts can't be negative." };

  const { supabase } = await requireUser();
  // The server decides what "today" is, so the log always lands on the Dhaka date.
  // One row per day: saving again overwrites today's row instead of adding a new one.
  const { error } = await supabase
    .from("daily_logs")
    .upsert({ ...parsed.data, date: dhakaDate() }, { onConflict: "user_id,date" });
  if (error) return { error: `Could not save: ${error.message}` };

  refresh();
  return { saved: true };
}
