import { addDays, weekStart } from "./dates";

type Log = { date: string; study_hours: number | string };
export type HeatDay = { date: string; value: number } | null;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * 53 columns of Sunday→Saturday weeks, ending with today's week (like GitHub).
 * values maps "YYYY-MM-DD" to that day's number (study hours, LeetCode submissions); missing days are 0.
 * Days after today are null so the last column can be partly empty.
 */
export function yearHeatmap(values: Record<string, number>, today: string): HeatDay[][] {
  const first = addDays(weekStart(today), -52 * 7);
  return Array.from({ length: 53 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(first, w * 7 + d);
      return date > today ? null : { date, value: values[date] ?? 0 };
    }),
  );
}

/** Colour step 0–4 for a day's value; steps are the top of levels 1–3 (default: study hours). */
export function heatLevel(value: number, [a, b, c]: readonly number[] = [1, 2, 4]): 0 | 1 | 2 | 3 | 4 {
  return value <= 0 ? 0 : value <= a ? 1 : value <= b ? 2 : value <= c ? 3 : 4;
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

/** LeetCode total for every day from the first snapshot up to today; days without a sync keep the last known total. */
export function leetcodeSeries(snapshots: { date: string; total: number }[], today: string): { date: string; total: number }[] {
  const totals = new Map(snapshots.map((s) => [s.date, s.total]));
  const start = snapshots.reduce((min, s) => (s.date < min ? s.date : min), today);
  const points = [];
  let total = 0;
  for (let date = start; date <= today; date = addDays(date, 1)) {
    total = totals.get(date) ?? total;
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
