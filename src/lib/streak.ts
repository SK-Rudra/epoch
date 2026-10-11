import { addDays } from "./dates";

/**
 * Consecutive days with study_hours > 0, counting back from today.
 * If today has no study yet, counting starts from yesterday, so the streak
 * isn't shown as broken before the day is over.
 */
export function studyStreak(logs: { date: string; study_hours: number | string }[], today: string): number {
  const studied = new Set(logs.filter((l) => Number(l.study_hours) > 0).map((l) => l.date));
  let day = studied.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (studied.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}
