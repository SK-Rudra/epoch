import { describe, expect, it } from "vitest";
import { dhakaTime } from "./dates";
import { dayPlan, type Schedule } from "./schedule";

const schedule: Schedule = {
  class_days: ["Sun", "Mon", "Tue", "Wed"],
  off_days: ["Thu", "Fri", "Sat"],
  class_day_blocks: [
    { start: "08:00", end: "17:00", label: "University" },
    { start: "19:00", end: "20:00", label: "DSA" },
  ],
  off_day_blocks: [{ start: "08:30", end: "12:30", label: "Deep work" }],
};

describe("dayPlan", () => {
  it("uses class-day blocks Sun–Wed and marks past / now / upcoming", () => {
    const plan = dayPlan(schedule, "2026-10-14", "19:30"); // Wednesday
    expect(plan.day).toBe("Wed");
    expect(plan.kind).toBe("class");
    expect(plan.blocks.map((b) => b.state)).toEqual(["past", "now"]);
  });

  it("uses off-day blocks Thu–Sat", () => {
    const plan = dayPlan(schedule, "2026-10-15", "07:00"); // Thursday
    expect(plan.kind).toBe("off");
    expect(plan.blocks).toEqual([{ start: "08:30", end: "12:30", label: "Deep work", state: "upcoming" }]);
  });

  it("start is inclusive, end is exclusive", () => {
    const at = (time: string) => dayPlan(schedule, "2026-10-11", time).blocks[0].state; // Sunday
    expect(at("08:00")).toBe("now");
    expect(at("16:59")).toBe("now");
    expect(at("17:00")).toBe("past");
  });

  it("returns no blocks for a day in neither list", () => {
    const plan = dayPlan({ ...schedule, off_days: [] }, "2026-10-17", "10:00"); // Saturday
    expect(plan).toEqual({ day: "Sat", kind: null, blocks: [] });
  });
});

describe("dhakaTime", () => {
  it("is 24-hour HH:MM in Dhaka (UTC+6)", () => {
    expect(dhakaTime(new Date("2026-10-14T18:05:00Z"))).toBe("00:05");
    expect(dhakaTime(new Date("2026-10-14T13:30:00Z"))).toBe("19:30");
  });
});
