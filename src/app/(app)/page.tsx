import { Suspense } from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { CountUp, Reveal, RevealItem } from "@/components/motion";
import { ProgressBar } from "@/components/progress-bar";
import { RunClock, RunTimeline, Sparkline, UptimeStrip } from "@/components/run-viz";
import { cumulativeLeetcode } from "@/lib/activity";
import { dhakaDate } from "@/lib/dates";
import { currentPhase, overallProgress, phaseProgress, type Status } from "@/lib/progress";
import { logLine, recentLogs, runDay, timeline, uptime } from "@/lib/run";
import { studyStreak } from "@/lib/streak";
import { requireUser } from "@/lib/supabase/server";
import { targets } from "../../../data/roadmap-seed.json";
import { signOut } from "../login/actions";
import { QuickLogForm } from "./quick-log-form";

export const metadata = { title: "Dashboard" };

type PhaseRow = {
  number: number;
  title: string;
  role_name: string;
  start_date: string;
  end_date: string;
  skills: { status: Status }[];
  courses: { status: Status }[];
  projects: { status: Status }[];
  goals: { done: boolean }[];
};

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8 md:py-10">
      <Suspense fallback={<DashboardSkeleton />}>
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
      .select("number, title, role_name, start_date, end_date, skills(status), courses(status), projects(status), goals(done)")
      .returns<PhaseRow[]>(),
    // ponytail: loads every daily log (Supabase caps at 1000 rows ≈ 2.7 years); switch to a SQL sum if it ever gets there.
    supabase.from("daily_logs").select("date, study_hours, leetcode_solved, ielts_minutes, workout, note, updated_at"),
  ]);
  if (phasesRes.error) throw new Error(phasesRes.error.message);
  if (logsRes.error) throw new Error(logsRes.error.message);

  const phases = phasesRes.data;
  const logs = logsRes.data;
  if (phases.length === 0) return <NoRun />;

  const phase = currentPhase(phases, today)!;
  const progress = phaseProgress(phase);
  const run = runDay(phases, today);
  const line = timeline(phases, today);
  const leetcode = logs.reduce((sum, l) => sum + l.leetcode_solved, 0);
  const streak = studyStreak(logs, today);
  const overall = overallProgress(phases);
  const todayLog = logs.find((l) => l.date === today);
  const recent = recentLogs(logs, today).map(logLine);

  return (
    <div className="flex flex-col gap-10">
      {/* The title is not animated: it's the first thing to paint (and what Lighthouse times). */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-mono text-xs text-graphite">
          <p>
            run started {run.start} · day {run.day} of {run.total} · epoch {phase.number}/{phases.length}
          </p>
          <RunClock start={run.start} />
        </div>
        <h1 className="text-2xl text-balance md:text-3xl">{phase.title}</h1>
        <p className="text-graphite">
          <Link href={`/phases/${phase.number}`} className="text-ink underline decoration-graphite/60 underline-offset-4 transition-colors hover:decoration-ink">
            Epoch {phase.number}/{phases.length}
          </Link>{" "}
          · {phase.role_name} · ends {phase.end_date} · <span className="font-mono">{progress}%</span> done
        </p>
      </header>

      <Reveal className="flex flex-col gap-10">
        <RevealItem>
          <RunTimeline
            current={phase.number}
            today={line.today}
            segments={line.segments.map(({ phase: p, offset, width }) => ({
              number: p.number,
              title: p.title,
              offset,
              width,
              progress: phaseProgress(p),
            }))}
          />
        </RevealItem>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14">
          <div className="flex flex-col gap-10">
            <RevealItem as="section" className="flex flex-col gap-4">
              <h2 className="sr-only">Metrics</h2>
              <dl className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 sm:grid-cols-[8rem_7rem_minmax(0,1fr)] sm:gap-y-6">
                <Metric label="Overall" value={<><CountUp value={overall} />%</>}>
                  <ProgressBar label="Overall progress" value={overall} className="h-1" delay={0.15} />
                </Metric>
                <Metric
                  label="LeetCode"
                  value={<><CountUp value={leetcode} delay={0.05} /><span className="text-graphite"> / {targets.leetcode_total}</span></>}
                >
                  <Sparkline points={cumulativeLeetcode(logs, today).slice(-30).map((p) => p.total)} target={targets.leetcode_total} />
                </Metric>
                <Metric label="Study uptime" value={<><CountUp value={streak} delay={0.1} />d</>}>
                  <UptimeStrip days={uptime(logs, today)} />
                </Metric>
              </dl>
            </RevealItem>

            <RevealItem as="section" className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg">Log today</h2>
                <span className="font-mono text-xs text-graphite">{today}</span>
              </div>
              {/* key: re-fill the form whenever today's saved row changes (e.g. after saving from the L dialog) */}
              <QuickLogForm key={todayLog?.updated_at ?? "new"} today={todayLog} />
            </RevealItem>
          </div>

          <RevealItem as="section" className="flex flex-col gap-3 lg:border-l lg:border-grid lg:pl-8">
            <h2 className="text-lg">Recent log</h2>
            {recent.length > 0 ? (
              <ol className="flex flex-col gap-1.5 font-mono text-xs leading-5">
                {recent.map((l) => (
                  <li key={l.stamp + l.parts.join()}>
                    <span className="text-graphite">[{l.stamp}]</span> {l.parts.join(" · ")}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-graphite">
                Nothing logged in the last 7 days. Fill in today&apos;s numbers, or press{" "}
                <kbd className="rounded border border-graphite/80 px-1 font-mono text-xs">L</kbd> from any page.
              </p>
            )}
          </RevealItem>
        </div>
      </Reveal>

      <form action={signOut} className="flex items-center justify-between gap-3 border-t border-grid pt-4 text-sm text-graphite">
        <span className="truncate">{user.email}</span>
        <button className="inline-flex h-11 items-center gap-2 px-2 transition-[color,transform] hover:text-ink active:scale-[0.97]">
          <LogOut size={16} strokeWidth={1.75} aria-hidden />
          Sign out
        </button>
      </form>
    </div>
  );
}

// One row of the metrics list. Phones: label + number on one line, chart underneath. Wider: three columns.
function Metric({ label, value, children }: { label: string; value: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="contents">
      <dt className="text-sm text-graphite">{label}</dt>
      <dd className="text-right font-mono text-xl sm:text-left">{value}</dd>
      <dd className="col-span-2 mb-3 sm:col-span-1 sm:mb-0">{children}</dd>
    </div>
  );
}

function NoRun() {
  return (
    <div className="flex max-w-prose flex-col gap-2">
      <h1 className="text-2xl">No run loaded yet</h1>
      <p className="text-graphite">
        The roadmap hasn&apos;t been added to the database. Run <code className="font-mono text-ink">npm run seed</code> once,
        then reload this page.
      </p>
    </div>
  );
}

// Same shapes and heights as the real dashboard, so nothing jumps when the data arrives.
function DashboardSkeleton() {
  const block = "animate-pulse rounded bg-grid/70";
  return (
    <div className="flex flex-col gap-10" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex flex-col gap-3">
        <div className={`${block} h-4 w-72 max-w-full`} />
        <div className={`${block} h-9 w-3/4`} />
        <div className={`${block} h-6 w-1/2`} />
      </div>
      <div className={`${block} h-8`} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-6">
            {[0, 1, 2].map((i) => <div key={i} className={`${block} h-8`} />)}
          </div>
          <div className={`${block} h-52`} />
        </div>
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className={`${block} h-4`} />)}
        </div>
      </div>
    </div>
  );
}
