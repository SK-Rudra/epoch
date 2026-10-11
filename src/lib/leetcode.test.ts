import { describe, expect, it } from "vitest";
import { timeAgo } from "./dates";
import { LeetcodeError, leetcodeStreak, parseLeetcode, solvedSince } from "./leetcode";

// Same shape as a real response (checked against leetcode.com/graphql on 2026-10-12), made-up numbers.
const DAY = 86_400;
const response = (over: Record<string, unknown> = {}) => ({
  data: {
    matchedUser: {
      submitStatsGlobal: {
        acSubmissionNum: [
          { difficulty: "All", count: 63 },
          { difficulty: "Easy", count: 40 },
          { difficulty: "Medium", count: 20 },
          { difficulty: "Hard", count: 3 },
        ],
      },
      userCalendar: { submissionCalendar: JSON.stringify({ [20_372 * DAY]: 4, [20_373 * DAY]: 1 }) },
    },
    recentAcSubmissionList: [{ title: "Two Sum", titleSlug: "two-sum", timestamp: String(20_373 * DAY + 3600) }],
    ...over,
  },
});

describe("parseLeetcode", () => {
  it("reads counts by difficulty, the calendar as UTC dates and recent solves", () => {
    expect(parseLeetcode(response())).toEqual({
      total: 63,
      easy: 40,
      medium: 20,
      hard: 3,
      calendar: { "2025-10-11": 4, "2025-10-12": 1 },
      recent: [{ title: "Two Sum", slug: "two-sum", at: "2025-10-12T01:00:00.000Z" }],
    });
  });

  it("treats a missing recent list as empty", () => {
    expect(parseLeetcode(response({ recentAcSubmissionList: null })).recent).toEqual([]);
  });

  const fails = (json: unknown, message: string) => {
    expect(() => parseLeetcode(json)).toThrow(LeetcodeError);
    expect(() => parseLeetcode(json)).toThrow(message);
  };

  it("says so when the username doesn't exist", () => {
    fails({ data: { matchedUser: null, recentAcSubmissionList: null }, errors: [{ message: "That user does not exist." }] }, "user not found");
  });

  it("rejects a changed shape instead of saving wrong numbers", () => {
    fails(null, "changed shape"); // not JSON at all (e.g. an HTML error page)
    fails({ errors: [{ message: "boom" }] }, "changed shape"); // no data
    fails(response({ matchedUser: { submitStatsGlobal: {}, userCalendar: { submissionCalendar: "{}" } } }), "changed shape");
    const noHard = response();
    noHard.data.matchedUser.submitStatsGlobal.acSubmissionNum.pop();
    fails(noHard, "changed shape");
    const textCount = response();
    (textCount.data.matchedUser.submitStatsGlobal.acSubmissionNum[0] as { count: unknown }).count = "63";
    fails(textCount, "changed shape");
  });

  it("rejects a calendar that isn't valid JSON or has bad entries", () => {
    const cal = (submissionCalendar: string) =>
      response({ matchedUser: { ...response().data.matchedUser, userCalendar: { submissionCalendar } } });
    fails(cal("not json"), "changed shape");
    fails(cal(JSON.stringify({ yesterday: 1 })), "changed shape");
    fails(cal(JSON.stringify({ 1760140800: -1 })), "changed shape");
  });
});

describe("solvedSince (today's LeetCode count)", () => {
  const today = "2026-10-12";

  it("is today's total minus the latest snapshot before today", () => {
    expect(solvedSince(60, [{ date: "2026-10-10", total: 50 }, { date: "2026-10-11", total: 57 }], today)).toBe(3);
  });

  it("ignores today's own snapshot when syncing again later the same day", () => {
    expect(solvedSince(62, [{ date: today, total: 60 }, { date: "2026-10-11", total: 57 }], today)).toBe(5);
  });

  it("spans a gap: everything since the last snapshot lands on today", () => {
    expect(solvedSince(70, [{ date: "2026-10-01", total: 50 }], today)).toBe(20);
  });

  it("is null on the very first sync, and never negative", () => {
    expect(solvedSince(60, [], today)).toBeNull();
    expect(solvedSince(60, [{ date: today, total: 60 }], today)).toBeNull();
    expect(solvedSince(55, [{ date: "2026-10-11", total: 57 }], today)).toBe(0);
  });
});

describe("leetcodeStreak", () => {
  const now = new Date("2026-10-12T10:00:00Z");

  it("counts UTC days with submissions up to today, or up to yesterday if none yet today", () => {
    expect(leetcodeStreak({ "2026-10-10": 1, "2026-10-11": 2, "2026-10-12": 1 }, now)).toBe(3);
    expect(leetcodeStreak({ "2026-10-10": 1, "2026-10-11": 2 }, now)).toBe(2);
    expect(leetcodeStreak({ "2026-10-09": 1, "2026-10-11": 0 }, now)).toBe(0);
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-10-12T12:00:00Z");
  it("reads like a person would say it", () => {
    expect(timeAgo("2026-10-12T11:59:30Z", now)).toBe("just now");
    expect(timeAgo("2026-10-12T11:15:00Z", now)).toBe("45 min ago");
    expect(timeAgo("2026-10-11T12:00:00Z", now)).toBe("24 h ago");
    expect(timeAgo("2026-10-09T12:00:00Z", now)).toBe("3 days ago");
  });
});
