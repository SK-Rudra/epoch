import { Suspense } from "react";
import Link from "next/link";
import { ProgressBar } from "@/components/progress-bar";
import { dhakaDate } from "@/lib/dates";
import { currentPhase, overallProgress, phaseProgress, type Status } from "@/lib/progress";
import { studyStreak } from "@/lib/streak";
import { requireUser } from "@/lib/supabase/server";
import { targets } from "../../data/roadmap-seed.json";
import { signOut } from "./login/actions";
import { QuickLogForm } from "./quick-log-form";

type PhaseRow = {
  number: number;
  title: string;
  start_date: string;
  end_date: string;
  skills: { status: Status }[];
  courses: { status: Status }[];
  projects: { status: Status }[];
  goals: { done: boolean }[];
};

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

async function Dashboard() {
  const { supabase, user } = await requireUser();
  const today = dhakaDate();

  // Both queries run at the same time.
  const [phasesRes, logsRes] = await Promise.all([
    supabase
      .from("phases")
      .select("number, title, start_date, end_date, skills(status), courses(status), projects(status), goals(done)")
      .returns<PhaseRow[]>(),
    // ponytail: loads every daily log (Supabase caps at 1000 rows ≈ 2.7 years); switch to a SQL sum if it ever gets there.
    supabase.from("daily_logs").select("date, study_hours, leetcode_solved, ielts_minutes, workout, note"),
  ]);
  if (phasesRes.error) throw new Error(phasesRes.error.message);
  if (logsRes.error) throw new Error(logsRes.error.message);

  const phases = phasesRes.data;
  const logs = logsRes.data;
  const phase = currentPhase(phases, today);
  const leetcode = logs.reduce((sum, l) => sum + l.leetcode_solved, 0);
  const streak = studyStreak(logs, today);
  const overall = overallProgress(phases);

  return (
    <div className="flex flex-col gap-6">
      {phase ? (
        <Link href={`/phases/${phase.number}`} className="flex flex-col gap-2 rounded-lg border border-line p-4">
          <p className="text-sm text-muted">
            Current phase {phase.number} · {phase.start_date} → {phase.end_date}
          </p>
          <h1 className="text-xl font-bold">{phase.title}</h1>
          <ProgressBar label="Current phase progress" value={phaseProgress(phase)} />
          <p className="text-sm text-muted">{phaseProgress(phase)}% of this phase done →</p>
        </Link>
      ) : (
        <p className="text-muted">No phases yet. Run the seed script.</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Overall" value={`${overall}%`}>
          <ProgressBar label="Overall progress" value={overall} />
        </Stat>
        <Stat label="LeetCode" value={`${leetcode} / ${targets.leetcode_total}`}>
          <ProgressBar label="LeetCode progress" value={Math.floor((leetcode / targets.leetcode_total) * 100)} />
        </Stat>
        <Stat label="Study streak" value={`${streak} ${streak === 1 ? "day" : "days"}`} className="col-span-2" />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Today · {today}</h2>
        <QuickLogForm today={logs.find((l) => l.date === today)} />
      </section>

      <form action={signOut} className="flex items-center justify-between gap-3 text-sm text-muted">
        <span className="truncate">{user.email}</span>
        <button className="rounded-lg border border-line px-3 py-2">Sign out</button>
      </form>
    </div>
  );
}

function Stat({ label, value, className = "", children }: {
  label: string;
  value: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-2 rounded-lg border border-line p-4 ${className}`}>
      <p className="text-sm text-muted">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {children}
    </div>
  );
}
