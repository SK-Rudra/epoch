import { timingSafeEqual } from "node:crypto";
import { syncLeetcode } from "@/lib/leetcode-sync";
import { allowedUserId, createAdminClient } from "@/lib/supabase/admin";

// Daily LeetCode sync, called by Vercel Cron (schedule in vercel.json): 17:00 UTC = 23:00 Dhaka, ±59 min on
// the Hobby plan, so it always runs before Dhaka midnight and the day's solves land on the day they were made.
// No user is signed in here, so src/proxy.ts skips /api/cron/* and this route is protected by
// CRON_SECRET alone: Vercel sends it as "Authorization: Bearer <CRON_SECRET>".
export async function GET(request: Request) {
  if (!authorized(request.headers.get("authorization"))) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const result = await syncLeetcode(admin, await allowedUserId(admin));
  return Response.json(result, { status: result.ok ? 200 : result.retryInMinutes ? 429 : 502 });
}

// Fails closed when CRON_SECRET is missing. Constant-time compare so the secret can't be guessed by timing.
function authorized(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
