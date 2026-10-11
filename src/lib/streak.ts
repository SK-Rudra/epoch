import { addDays } from "./dates";

/**
 * Consecutive active days, counting back from today.
 * If today isn't active yet, counting starts from yesterday, so the streak
 * isn't shown as broken before the day is over.
 */
export function streakFrom(active: Set<string>, today: string): number {
  let day = active.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (active.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

/** Days with study_hours > 0 in a row, up to today. */
export function studyStreak(logs: { date: string; study_hours: number | string }[], today: string): number {
  return streakFrom(new Set(logs.filter((l) => Number(l.study_hours) > 0).map((l) => l.date)), today);
}
