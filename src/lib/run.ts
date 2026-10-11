// Display maths for the dashboard's "training run" view. Pure functions, so they're easy to test.
import { addDays, daysBetween, dhakaDate, dhakaTime } from "./dates";

type Span = { start_date: string; end_date: string };

/** Short phase names for tight spaces (top bar, page titles); index 0 = phase 1. */
export const PHASE_SHORT = ["Python Dev", "Backend Dev", "ML Eng", "NLP/LLM Eng", "AI Eng", "Job-Ready"];

/** Where today sits in one phase: "day 12 of 61", "starts in 50 days" or "finished". */
export function phaseClock(phase: Span, today: string): string {
  const total = daysBetween(phase.start_date, phase.end_date) + 1;
  const day = daysBetween(phase.start_date, today) + 1;
  if (day < 1) return `starts in ${1 - day} ${1 - day === 1 ? "day" : "days"}`;
  if (day > total) return "finished";
  return `day ${day} of ${total}`;
}

/**
 * The whole run = first phase start → last phase end.
 * day is 1 on the start date, 0 before the run, and stops at total after it ends.
 */
export function runDay(phases: Span[], today: string) {
  const start = phases.map((p) => p.start_date).sort()[0];
  const end = phases.map((p) => p.end_date).sort().at(-1)!;
  const total = daysBetween(start, end) + 1;
  const day = Math.min(Math.max(daysBetween(start, today) + 1, 0), total);
  return { start, end, day, total };
}

/** Where each phase and today sit on the run timeline, as fractions (0–1) of its width. */
export function timeline<T extends Span>(phases: T[], today: string) {
  const { start, total } = runDay(phases, today);
  const sorted = [...phases].sort((a, b) => a.start_date.localeCompare(b.start_date));
  return {
    segments: sorted.map((phase) => ({
      phase,
      offset: daysBetween(start, phase.start_date) / total,
      width: (daysBetween(phase.start_date, phase.end_date) + 1) / total,
    })),
    // Middle of today's slot, kept on the bar before/after the run.
    today: Math.min(Math.max((daysBetween(start, today) + 0.5) / total, 0), 1),
  };
}

/** The last `days` dates ending today, oldest first, each marked studied (study_hours > 0) or not. */
export function uptime(logs: { date: string; study_hours: number | string }[], today: string, days = 30) {
  const studied = new Set(logs.filter((l) => Number(l.study_hours) > 0).map((l) => l.date));
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - days + 1);
    return { date, studied: studied.has(date) };
  });
}

type Log = {
  date: string;
  updated_at: string;
  study_hours: number | string;
  leetcode_solved: number;
  ielts_minutes: number;
  workout: boolean;
};

/**
 * One log row as a terminal-style line: "[Thu 14:02]" + "study +2.0h · leetcode +3".
 * The time is when the row was last saved, shown only if that save was on the same Dhaka day.
 */
export function logLine(l: Log) {
  const weekday = new Date(`${l.date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  const saved = new Date(l.updated_at);
  const time = dhakaDate(saved) === l.date ? dhakaTime(saved) : "--:--";
  const hours = Number(l.study_hours);
  const parts = [
    hours > 0 && `study +${hours.toFixed(1)}h`,
    l.leetcode_solved > 0 && `leetcode +${l.leetcode_solved}`,
    l.ielts_minutes > 0 && `ielts ${l.ielts_minutes}m`,
    l.workout && "workout",
  ].filter((p): p is string => Boolean(p));
  return { stamp: `${weekday} ${time}`, parts: parts.length ? parts : ["rest day"] };
}

/** Logs from the last 7 days (today included), newest first. */
export function recentLogs<T extends { date: string }>(logs: T[], today: string): T[] {
  const from = addDays(today, -6);
  return logs.filter((l) => l.date >= from && l.date <= today).sort((a, b) => b.date.localeCompare(a.date));
}
