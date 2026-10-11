"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { dhakaDate } from "@/lib/dates";
import { syncLeetcode } from "@/lib/leetcode-sync";
import { requireUser } from "@/lib/supabase/server";

export type LogState = { saved?: boolean; error?: string };

// Same limits as the daily_logs checks in supabase/migrations/0001_init.sql.
const logSchema = z.object({
  study_hours: z.coerce.number().min(0).max(24),
  leetcode_solved: z.coerce.number().int().min(0).max(1000), // a synced day after a gap can be big
  leetcode_loaded: z.coerce.number().int(), // what the form showed, to tell a typed number from the synced one
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

  // LeetCode is filled in by the sync. Only a number you changed counts as yours (and then sync leaves it alone);
  // an untouched one isn't sent, so it can't overwrite a newer synced value.
  const { leetcode_loaded, leetcode_solved, ...log } = parsed.data;
  const leetcode = leetcode_solved === leetcode_loaded ? {} : { leetcode_solved, leetcode_manual: true };

  const { supabase } = await requireUser();
  // The server decides what "today" is, so the log always lands on the Dhaka date.
  // One row per day: saving again overwrites today's row instead of adding a new one.
  const { error } = await supabase
    .from("daily_logs")
    .upsert({ ...log, ...leetcode, date: dhakaDate() }, { onConflict: "user_id,date" });
  if (error) return { error: `Could not save: ${error.message}` };

  refresh();
  return { saved: true };
}

/** Dashboard "Sync now": same sync as the daily cron, but as you (your session, normal RLS). */
export async function syncLeetcodeNow(): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const result = await syncLeetcode(supabase, user.id);
  if (!result.ok) {
    return { error: result.retryInMinutes ? `Synced recently. Try again in ${result.retryInMinutes} min.` : result.error };
  }
  refresh();
  return {};
}
