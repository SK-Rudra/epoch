export type Status = "not_started" | "in_progress" | "done";

export type PhaseItems = {
  skills: { status: Status }[];
  courses: { status: Status }[];
  projects: { status: Status }[];
  goals: { done: boolean }[];
};

type Count = { done: number; total: number };

function count(p: PhaseItems): Count {
  const tracked = [...p.skills, ...p.courses, ...p.projects];
  return {
    done: tracked.filter((i) => i.status === "done").length + p.goals.filter((g) => g.done).length,
    total: tracked.length + p.goals.length,
  };
}

// Rounded down, so 100% only shows when everything is actually done.
function percent({ done, total }: Count): number {
  return total === 0 ? 0 : Math.floor((done / total) * 100);
}

/** done items / (skills + courses + projects + goals) for one phase. */
export function phaseProgress(phase: PhaseItems): number {
  return percent(count(phase));
}

/** Same formula across every item of every phase (not an average of phase %s). */
export function overallProgress(phases: PhaseItems[]): number {
  const totals = phases.map(count).reduce((a, b) => ({ done: a.done + b.done, total: a.total + b.total }), {
    done: 0,
    total: 0,
  });
  return percent(totals);
}

/**
 * The phase whose dates contain today. Between phases or after the last one,
 * the most recently started phase; before the first one, the first phase.
 */
export function currentPhase<T extends { start_date: string }>(phases: T[], today: string): T | undefined {
  const sorted = [...phases].sort((a, b) => a.start_date.localeCompare(b.start_date));
  return sorted.findLast((p) => p.start_date <= today) ?? sorted[0];
}
