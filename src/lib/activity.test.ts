import { describe, expect, it } from "vitest";
import { cumulativeLeetcode, heatLevel, niceTicks, weeklyHours, yearHeatmap } from "./activity";

const today = "2026-10-14"; // Wednesday; its week starts Sunday 2026-10-11
const log = (date: string, study_hours: number | string = 0, leetcode_solved = 0) => ({ date, study_hours, leetcode_solved });

describe("yearHeatmap", () => {
  const grid = yearHeatmap([log("2026-10-12", "2.5"), log("2025-10-12", 1)], today);

  it("is 53 Sunday-start weeks ending with today's week", () => {
    expect(grid).toHaveLength(53);
    expect(grid[0][0]?.date).toBe("2025-10-12");
    expect(grid[52][0]?.date).toBe("2026-10-11");
  });

  it("fills hours from logs, 0 for missing days, null after today", () => {
    expect(grid[0][0]?.hours).toBe(1);
    expect(grid[52][1]).toEqual({ date: "2026-10-12", hours: 2.5 });
    expect(grid[52][2]?.hours).toBe(0);
    expect(grid[52][3]).toEqual({ date: today, hours: 0 });
    expect(grid[52][4]).toBeNull();
  });
});

describe("heatLevel", () => {
  it("buckets hours into 5 steps", () => {
    expect([0, 0.5, 1, 1.5, 2, 3, 4, 4.5, 12].map(heatLevel)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });
});

describe("weeklyHours", () => {
  it("sums each Sunday-start week, includes empty weeks, oldest first", () => {
    const weeks = weeklyHours(
      [log("2026-10-11", "1.10"), log("2026-10-14", "2.20"), log("2026-10-10", 3), log("2026-09-20", 1)],
      today,
      4,
    );
    expect(weeks).toEqual([
      { week: "2026-09-20", hours: 1 },
      { week: "2026-09-27", hours: 0 },
      { week: "2026-10-04", hours: 3 }, // Saturday 10-10 belongs to the previous week
      { week: "2026-10-11", hours: 3.3 }, // no 3.3000000000000003
    ]);
  });
});

describe("cumulativeLeetcode", () => {
  it("is just today at 0 with no logs", () => {
    expect(cumulativeLeetcode([], today)).toEqual([{ date: today, total: 0 }]);
  });

  it("runs a daily total from the first log to today, carrying across gaps", () => {
    expect(cumulativeLeetcode([log("2026-10-13", 0, 2), log("2026-10-11", 0, 3)], today)).toEqual([
      { date: "2026-10-11", total: 3 },
      { date: "2026-10-12", total: 3 },
      { date: "2026-10-13", total: 5 },
      { date: "2026-10-14", total: 5 },
    ]);
  });
});

describe("niceTicks", () => {
  it("uses round 1/2/5 steps from 0 up to at least the max", () => {
    expect(niceTicks(200)).toEqual([0, 50, 100, 150, 200]);
    expect(niceTicks(13.5)).toEqual([0, 5, 10, 15]);
    expect(niceTicks(3)).toEqual([0, 1, 2, 3]);
    expect(niceTicks(0.7)).toEqual([0, 0.2, 0.4, 0.6, 0.8]);
  });

  it("still draws an axis when there's no data", () => {
    expect(niceTicks(0)).toEqual([0, 1]);
  });
});
