import { addDays, weekStart } from "./dates";

type Log = { date: string; study_hours: number | string; leetcode_solved: number };
export type HeatDay = { date: string; hours: number } | null;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * 53 columns of Sunday→Saturday weeks, ending with today's week (like GitHub).
 * Days after today are null so the last column can be partly empty.
 */
export function yearHeatmap(logs: Log[], today: string): HeatDay[][] {
  const hours = new Map(logs.map((l) => [l.date, Number(l.study_hours)]));
  const first = addDays(weekStart(today), -52 * 7);
  return Array.from({ length: 53 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(first, w * 7 + d);
      return date > today ? null : { date, hours: hours.get(date) ?? 0 };
    }),
  );
}

/** Colour step 0–4 for a day's study hours. */
export function heatLevel(hours: number): 0 | 1 | 2 | 3 | 4 {
  return hours <= 0 ? 0 : hours <= 1 ? 1 : hours <= 2 ? 2 : hours <= 4 ? 3 : 4;
}

/** Total study hours for each of the last `weeks` Sunday-start weeks, oldest first. */
export function weeklyHours(logs: Log[], today: string, weeks = 12): { week: string; hours: number }[] {
  const totals = new Map<string, number>();
  for (const l of logs) {
    const w = weekStart(l.date);
    totals.set(w, (totals.get(w) ?? 0) + Number(l.study_hours));
  }
  const last = weekStart(today);
  return Array.from({ length: weeks }, (_, i) => {
    const week = addDays(last, (i - weeks + 1) * 7);
    return { week, hours: round2(totals.get(week) ?? 0) };
  });
}

/** Running LeetCode total for every day from the first log up to today. */
export function cumulativeLeetcode(logs: Log[], today: string): { date: string; total: number }[] {
  const solved = new Map(logs.map((l) => [l.date, l.leetcode_solved]));
  const start = logs.reduce((min, l) => (l.date < min ? l.date : min), today);
  const points = [];
  let total = 0;
  for (let date = start; date <= today; date = addDays(date, 1)) {
    total += solved.get(date) ?? 0;
    points.push({ date, total });
  }
  return points;
}

/**
 * Round axis ticks for a chart whose largest value is `max`: steps of 1, 2 or 5 × 10ⁿ,
 * about `count` steps, starting at 0 and ending at or above max.
 */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw)!;
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => Math.round(i * step * 1e6) / 1e6);
}
