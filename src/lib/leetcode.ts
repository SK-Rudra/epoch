// LeetCode stats for one public profile.
//
// UNOFFICIAL ENDPOINT: https://leetcode.com/graphql is what LeetCode's own website calls. It's public
// (no login, no cookies) but undocumented, so LeetCode can rename or remove fields at any time.
// Everything that knows its shape lives in this file, and every response is checked with zod
// before the app trusts it. If it breaks, the app keeps showing the last saved snapshot.
import { z } from "zod";
import { streakFrom } from "./streak";

const ENDPOINT = "https://leetcode.com/graphql";

const QUERY = `query epoch($username: String!) {
  matchedUser(username: $username) {
    submitStatsGlobal { acSubmissionNum { difficulty count } }
    userCalendar { submissionCalendar }
  }
  recentAcSubmissionList(username: $username, limit: 20) { title titleSlug timestamp }
}`;

const count = z.number().int().min(0);
const unixSeconds = z.string().regex(/^\d+$/);

const Response = z.object({
  data: z.object({
    // null when the username doesn't exist
    matchedUser: z
      .object({
        submitStatsGlobal: z.object({ acSubmissionNum: z.array(z.object({ difficulty: z.string(), count })) }),
        // JSON inside a string: {"<unix seconds at UTC midnight>": submissions that day}
        userCalendar: z.object({ submissionCalendar: z.string() }),
      })
      .nullable(),
    recentAcSubmissionList: z.array(z.object({ title: z.string(), titleSlug: z.string(), timestamp: unixSeconds })).nullable(),
  }),
});

const Calendar = z.record(unixSeconds, count);

export type LeetcodeStats = {
  total: number;
  easy: number;
  medium: number;
  hard: number;
  /** Submissions per UTC day ("YYYY-MM-DD"), past year. LeetCode's days run on UTC. */
  calendar: Record<string, number>;
  /** Latest accepted solves, newest first. at = ISO time. */
  recent: { title: string; slug: string; at: string }[];
};

/** A problem we can explain to the user (bad username, changed response), as opposed to a network failure. */
export class LeetcodeError extends Error {}

const toIso = (seconds: string | number) => new Date(Number(seconds) * 1000).toISOString();

/** Checks a raw response and turns it into the numbers Epoch stores. Throws LeetcodeError if anything is off. */
export function parseLeetcode(json: unknown): LeetcodeStats {
  const parsed = Response.safeParse(json);
  if (!parsed.success) throw new LeetcodeError("LeetCode's response changed shape");
  const user = parsed.data.data.matchedUser;
  if (!user) throw new LeetcodeError("LeetCode user not found: check LEETCODE_USERNAME");

  const solved = new Map(user.submitStatsGlobal.acSubmissionNum.map((s) => [s.difficulty, s.count]));
  const [total, easy, medium, hard] = ["All", "Easy", "Medium", "Hard"].map((d) => solved.get(d));
  if (total === undefined || easy === undefined || medium === undefined || hard === undefined) {
    throw new LeetcodeError("LeetCode's response changed shape");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(user.userCalendar.submissionCalendar);
  } catch {
    throw new LeetcodeError("LeetCode's response changed shape");
  }
  const cal = Calendar.safeParse(raw);
  if (!cal.success) throw new LeetcodeError("LeetCode's response changed shape");

  return {
    total,
    easy,
    medium,
    hard,
    calendar: Object.fromEntries(Object.entries(cal.data).map(([s, n]) => [toIso(s).slice(0, 10), n])),
    recent: (parsed.data.data.recentAcSubmissionList ?? []).map((r) => ({ title: r.title, slug: r.titleSlug, at: toIso(r.timestamp) })),
  };
}

/** One request to LeetCode. Server-side only in practice (the browser would be blocked by CORS anyway). */
export async function fetchLeetcode(username: string): Promise<LeetcodeStats> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
    body: JSON.stringify({ query: QUERY, variables: { username } }),
    cache: "no-store", // caching is done by the saved snapshot, see src/lib/leetcode-sync.ts
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new LeetcodeError(`LeetCode answered ${res.status}`);
  return parseLeetcode(await res.json().catch(() => null));
}

/**
 * LeetCode problems solved today = today's total − the latest snapshot from before today.
 * null on the very first sync (nothing earlier to compare with). Never negative.
 */
export function solvedSince(total: number, snapshots: { date: string; total: number }[], today: string): number | null {
  const previous = snapshots.filter((s) => s.date < today).sort((a, b) => b.date.localeCompare(a.date))[0];
  return previous ? Math.max(0, total - previous.total) : null;
}

/** Current LeetCode streak: days in a row with a submission, up to today. LeetCode's days are UTC days. */
export function leetcodeStreak(calendar: Record<string, number>, now = new Date()): number {
  return streakFrom(new Set(Object.keys(calendar).filter((d) => calendar[d] > 0)), now.toISOString().slice(0, 10));
}
