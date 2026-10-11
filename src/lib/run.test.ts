import { describe, expect, it } from "vitest";
import { daysBetween } from "./dates";
import { logLine, phaseClock, recentLogs, runDay, timeline, uptime } from "./run";

// Same dates as data/roadmap-seed.json: Oct 1 2026 → Oct 31 2027.
const phases = [
  { number: 1, start_date: "2026-10-01", end_date: "2026-11-30" },
  { number: 2, start_date: "2026-12-01", end_date: "2027-01-31" },
  { number: 6, start_date: "2027-08-01", end_date: "2027-10-31" },
];

describe("daysBetween", () => {
  it("counts whole days across a year end and backwards", () => {
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
    expect(daysBetween("2026-10-12", "2026-10-01")).toBe(-11);
  });
});

describe("runDay", () => {
  it("is day 1 on the start date and counts the whole run inclusively", () => {
    expect(runDay(phases, "2026-10-01")).toEqual({ start: "2026-10-01", end: "2027-10-31", day: 1, total: 396 });
    expect(runDay(phases, "2026-10-12").day).toBe(12);
  });

  it("is 0 before the run and stops at the last day after it", () => {
    expect(runDay(phases, "2026-09-30").day).toBe(0);
    expect(runDay(phases, "2028-01-01").day).toBe(396);
  });
});

describe("timeline", () => {
  it("places phases by date, widths proportional to length", () => {
    const t = timeline(phases, "2026-10-01");
    expect(t.segments.map((s) => s.phase.number)).toEqual([1, 2, 6]);
    expect(t.segments[0].offset).toBe(0);
    expect(t.segments[0].width).toBeCloseTo(61 / 396);
    expect(t.segments[1].offset).toBeCloseTo(61 / 396);
    expect(t.segments[2].offset + t.segments[2].width).toBeCloseTo(1);
  });

  it("keeps the today marker on the bar", () => {
    expect(timeline(phases, "2026-10-01").today).toBeCloseTo(0.5 / 396);
    expect(timeline(phases, "2020-01-01").today).toBe(0);
    expect(timeline(phases, "2030-01-01").today).toBe(1);
  });
});

describe("uptime", () => {
  it("returns the last N days oldest first, studied only when hours > 0", () => {
    const days = uptime(
      [
        { date: "2026-10-12", study_hours: "1.5" },
        { date: "2026-10-11", study_hours: 0 },
        { date: "2026-10-01", study_hours: 2 }, // outside a 3-day window
      ],
      "2026-10-12",
      3,
    );
    expect(days).toEqual([
      { date: "2026-10-10", studied: false },
      { date: "2026-10-11", studied: false },
      { date: "2026-10-12", studied: true },
    ]);
  });
});

describe("logLine", () => {
  const base = { date: "2026-10-08", study_hours: 0, leetcode_solved: 0, ielts_minutes: 0, workout: false };

  it("shows weekday, Dhaka save time and only non-zero parts", () => {
    // 08:02 UTC = 14:02 in Dhaka, same day.
    const line = logLine({ ...base, updated_at: "2026-10-08T08:02:00Z", study_hours: "2", leetcode_solved: 3, workout: true });
    expect(line).toEqual({ stamp: "Thu 14:02", parts: ["study +2.0h", "leetcode +3", "workout"] });
  });

  it("hides the time when the row was saved on another day", () => {
    const line = logLine({ ...base, updated_at: "2026-10-09T08:00:00Z", ielts_minutes: 30 });
    expect(line).toEqual({ stamp: "Thu --:--", parts: ["ielts 30m"] });
  });

  it("calls an all-zero day a rest day", () => {
    expect(logLine({ ...base, updated_at: "2026-10-08T08:00:00Z" }).parts).toEqual(["rest day"]);
  });
});

describe("recentLogs", () => {
  it("keeps the last 7 days, newest first", () => {
    const logs = [{ date: "2026-10-05" }, { date: "2026-10-12" }, { date: "2026-10-06" }, { date: "2026-10-13" }];
    expect(recentLogs(logs, "2026-10-12").map((l) => l.date)).toEqual(["2026-10-12", "2026-10-06"]);
  });
});

describe("phaseClock", () => {
  const p = { start_date: "2026-10-01", end_date: "2026-11-30" }; // 61 days
  it("counts days inside the phase", () => {
    expect(phaseClock(p, "2026-10-01")).toBe("day 1 of 61");
    expect(phaseClock(p, "2026-11-30")).toBe("day 61 of 61");
  });
  it("says when it starts or that it's finished", () => {
    expect(phaseClock(p, "2026-09-30")).toBe("starts in 1 day");
    expect(phaseClock(p, "2026-09-21")).toBe("starts in 10 days");
    expect(phaseClock(p, "2026-12-01")).toBe("finished");
  });
});
