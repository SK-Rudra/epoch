import type { SupabaseClient } from "@supabase/supabase-js";
import { dhakaDate } from "./dates";
import { fetchLeetcode, LeetcodeError, solvedSince } from "./leetcode";

/** At most one LeetCode request per this long (per day's snapshot). */
export const SYNC_INTERVAL_MS = 10 * 60_000;

export type SyncResult =
  | { ok: true; total: number }
  | { ok: false; error: string; retryInMinutes?: number };

/**
 * Fetches LeetCode once and saves it:
 *  - today's snapshot (Asia/Dhaka date), updated in place if today already has one;
 *  - today's daily_logs.leetcode_solved = today's total − previous snapshot, unless you typed it yourself.
 *
 * Takes the Supabase client from the caller: the cron passes the service-role client (no session),
 * "Sync now" passes your signed-in client (normal RLS). user_id is always written explicitly.
 *
 * The saved snapshot is the cache: if today's was saved under 10 minutes ago, LeetCode isn't called.
 */
export async function syncLeetcode(supabase: SupabaseClient, userId: string, now = new Date()): Promise<SyncResult> {
  const username = process.env.LEETCODE_USERNAME?.trim();
  if (!username) return { ok: false, error: "LEETCODE_USERNAME is not set" };
  const today = dhakaDate(now);

  // The latest two are enough: one may be today's, the other is then the previous day's.
  const latest = await supabase
    .from("leetcode_snapshots")
    .select("date, total, updated_at")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(2);
  if (latest.error) return { ok: false, error: latest.error.message };

  const todays = latest.data.find((s) => s.date === today);
  const wait = todays ? SYNC_INTERVAL_MS - (now.getTime() - Date.parse(todays.updated_at)) : 0;
  if (wait > 0) return { ok: false, error: "Synced less than 10 minutes ago", retryInMinutes: Math.ceil(wait / 60_000) };

  let stats;
  try {
    stats = await fetchLeetcode(username);
  } catch (e) {
    return { ok: false, error: e instanceof LeetcodeError ? e.message : "Couldn't reach LeetCode" };
  }

  const { calendar, recent, ...counts } = stats;
  const saved = await supabase
    .from("leetcode_snapshots")
    .upsert({ user_id: userId, date: today, ...counts, calendar, recent }, { onConflict: "user_id,date" });
  if (saved.error) return { ok: false, error: saved.error.message };

  const solved = solvedSince(stats.total, latest.data, today);
  if (solved !== null) {
    const log = await supabase.from("daily_logs").select("leetcode_manual").eq("user_id", userId).eq("date", today).maybeSingle();
    if (log.error) return { ok: false, error: log.error.message };
    if (!log.data?.leetcode_manual) {
      // Only date + leetcode_solved are sent, so an existing row keeps its hours, note, etc.
      const logged = await supabase
        .from("daily_logs")
        .upsert({ user_id: userId, date: today, leetcode_solved: solved }, { onConflict: "user_id,date" });
      if (logged.error) return { ok: false, error: logged.error.message };
    }
  }

  return { ok: true, total: stats.total };
}
