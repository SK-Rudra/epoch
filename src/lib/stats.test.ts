import { describe, expect, it } from "vitest";
import { addDays, dhakaDate, weekStart } from "./dates";
import { currentPhase, overallProgress, phaseProgress, type PhaseItems } from "./progress";
import { studyStreak } from "./streak";

describe("dates (Asia/Dhaka, UTC+6)", () => {
  it("rolls over to the next day at 18:00 UTC", () => {
    expect(dhakaDate(new Date("2026-10-11T17:59:00Z"))).toBe("2026-10-11");
    expect(dhakaDate(new Date("2026-10-11T18:00:00Z"))).toBe("2026-10-12");
  });

  it("adds days across month and year ends", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("weeks start on Sunday", () => {
    expect(weekStart("2026-10-11")).toBe("2026-10-11"); // Sunday
    expect(weekStart("2026-10-17")).toBe("2026-10-11"); // Saturday
    expect(weekStart("2026-10-01")).toBe("2026-09-27"); // Thursday, previous month
  });
});

const phase = (over: Partial<PhaseItems> = {}): PhaseItems => ({
  skills: [],
  courses: [],
  projects: [],
  goals: [],
  ...over,
});

describe("progress", () => {
  it("is 0% for an empty phase (no divide by zero)", () => {
    expect(phaseProgress(phase())).toBe(0);
    expect(overallProgress([])).toBe(0);
  });

  it("counts done skills/courses/projects and done goals; in_progress is not done", () => {
    const p = phase({
      skills: [{ status: "done" }, { status: "in_progress" }],
      courses: [{ status: "done" }],
      projects: [{ status: "not_started" }],
      goals: [{ done: true }, { done: false }, { done: false }, { done: false }],
    });
    expect(phaseProgress(p)).toBe(37); // 3 of 8 = 37.5 → 37
  });

  it("only shows 100% when everything is done", () => {
    const almost = phase({ goals: [...Array(199).fill({ done: true }), { done: false }] });
    expect(phaseProgress(almost)).toBe(99);
    expect(phaseProgress(phase({ skills: [{ status: "done" }] }))).toBe(100);
  });

  it("overall uses all items, not the average of phase percentages", () => {
    const small = phase({ goals: [{ done: true }] }); // 100%
    const big = phase({ goals: Array(9).fill({ done: false }) }); // 0%
    expect(overallProgress([small, big])).toBe(10); // 1 of 10, not (100+0)/2
  });
});

describe("currentPhase", () => {
  const phases = [
    { n: 2, start_date: "2027-01-01", end_date: "2027-03-31" },
    { n: 1, start_date: "2026-10-01", end_date: "2026-12-31" },
    { n: 3, start_date: "2027-05-01", end_date: "2027-07-31" },
  ];
  const at = (today: string) => currentPhase(phases, today)?.n;

  it("picks the phase containing today, including its first and last days", () => {
    expect(at("2026-11-15")).toBe(1);
    expect(at("2027-01-01")).toBe(2);
    expect(at("2027-03-31")).toBe(2);
  });

  it("handles gaps, before the start, after the end, and no phases", () => {
    expect(at("2027-04-15")).toBe(2); // gap → last started
    expect(at("2026-01-01")).toBe(1); // before → first
    expect(at("2030-01-01")).toBe(3); // after → last
    expect(currentPhase([], "2026-10-11")).toBeUndefined();
  });
});

describe("studyStreak", () => {
  const today = "2026-10-11";
  const log = (date: string, study_hours: number | string = 1) => ({ date, study_hours });

  it("is 0 with no logs", () => {
    expect(studyStreak([], today)).toBe(0);
  });

  it("counts consecutive days up to today", () => {
    expect(studyStreak([log("2026-10-09"), log("2026-10-10"), log("2026-10-11")], today)).toBe(3);
  });

  it("counts up to yesterday when today isn't logged yet", () => {
    expect(studyStreak([log("2026-10-09"), log("2026-10-10")], today)).toBe(2);
  });

  it("treats today logged with 0 hours like not logged yet", () => {
    expect(studyStreak([log("2026-10-10"), log("2026-10-11", 0)], today)).toBe(1);
  });

  it("stops at a gap or a 0-hour day", () => {
    expect(studyStreak([log("2026-10-07"), log("2026-10-09"), log("2026-10-10")], today)).toBe(2);
    expect(studyStreak([log("2026-10-08"), log("2026-10-09", 0), log("2026-10-10")], today)).toBe(1);
  });

  it("is 0 when the last study day was before yesterday", () => {
    expect(studyStreak([log("2026-10-08"), log("2026-10-09")], today)).toBe(0);
  });

  it("works across a month boundary and with numeric strings from Postgres", () => {
    expect(studyStreak([log("2026-09-30", "1.50"), log("2026-10-01", "2")], "2026-10-01")).toBe(2);
  });
});
