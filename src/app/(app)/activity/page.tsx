import { Suspense } from "react";
import { SectionHead } from "@/components/section-head";
import { cumulativeLeetcode, weeklyHours, yearHeatmap } from "@/lib/activity";
import { dhakaDate } from "@/lib/dates";
import { requireUser } from "@/lib/supabase/server";
import { targets } from "../../../../data/roadmap-seed.json";
import { Heatmap, LeetcodeLine, WeeklyBars } from "./charts";

export const metadata = { title: "Activity" };

export default function ActivityPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8 md:py-10">
      <Suspense fallback={<ActivitySkeleton />}>
        <Activity />
      </Suspense>
    </main>
  );
}

async function Activity() {
  const { supabase } = await requireUser();
  const today = dhakaDate();
  // ponytail: loads every daily log, same 1000-row ceiling as the dashboard.
  const { data: logs, error } = await supabase.from("daily_logs").select("date, study_hours, leetcode_solved");
  if (error) throw new Error(error.message);

  const grid = yearHeatmap(logs, today);
  const days = grid.flat().filter((d) => d !== null);
  const yearHours = Math.round(days.reduce((sum, d) => sum + d.hours, 0) * 10) / 10;
  const activeDays = days.filter((d) => d.hours > 0).length;
  const weeks = weeklyHours(logs, today);
  const best = Math.max(...weeks.map((w) => w.hours));
  const leetcode = cumulativeLeetcode(logs, today);

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl">Activity</h1>
        <p className="font-mono text-xs text-graphite">
          last 12 months · {yearHours} h studied · {activeDays} active {activeDays === 1 ? "day" : "days"} ·{" "}
          {leetcode.at(-1)!.total}/{targets.leetcode_total} leetcode
        </p>
        {logs.length === 0 && (
          <p className="text-graphite">Nothing logged yet. Your study hours and LeetCode count fill these charts after your first log (press L).</p>
        )}
      </header>

      <section className="flex flex-col gap-4">
        <SectionHead title="Study hours by day" note="last 12 months" />
        <Heatmap grid={grid} />
      </section>

      <div className="grid gap-12 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <SectionHead title="Hours per week" note={`last 12 weeks · best ${best} h`} />
          <WeeklyBars weeks={weeks} />
        </section>
        <section className="flex flex-col gap-4">
          <SectionHead title="LeetCode solved" note={`${leetcode.at(-1)!.total} / ${targets.leetcode_total}`} />
          <LeetcodeLine points={leetcode} target={targets.leetcode_total} />
        </section>
      </div>
    </div>
  );
}

// Same shapes as the real page so nothing jumps when it loads.
function ActivitySkeleton() {
  const block = "animate-pulse rounded bg-grid/70";
  return (
    <div className="flex flex-col gap-12" aria-busy="true" aria-label="Loading activity">
      <div className="flex flex-col gap-2">
        <div className={`${block} h-9 w-48`} />
        <div className={`${block} h-4 w-96 max-w-full`} />
      </div>
      <div className="flex flex-col gap-4">
        <div className={`${block} h-7 w-56`} />
        <div className={`${block} aspect-[53/9] max-w-[56rem]`} />
      </div>
      <div className="grid gap-12 lg:grid-cols-2">
        {[0, 1].map((k) => (
          <div key={k} className="flex flex-col gap-4">
            <div className={`${block} h-7 w-40`} />
            <div className={`${block} h-46`} />
          </div>
        ))}
      </div>
    </div>
  );
}
