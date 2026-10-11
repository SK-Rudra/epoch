import { Suspense } from "react";
import { LeetcodeWarning } from "@/components/leetcode-status";
import { SectionHead } from "@/components/section-head";
import { leetcodeSeries, weeklyHours, yearHeatmap } from "@/lib/activity";
import { dhakaDate, timeAgo } from "@/lib/dates";
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
  // ponytail: loads every daily log and snapshot, same 1000-row ceiling as the dashboard.
  const [logsRes, seriesRes, latestRes] = await Promise.all([
    supabase.from("daily_logs").select("date, study_hours"),
    supabase.from("leetcode_snapshots").select("date, total").order("date"),
    supabase
      .from("leetcode_snapshots")
      .select("calendar, recent, updated_at")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (logsRes.error) throw new Error(logsRes.error.message);
  const logs = logsRes.data;
  // LeetCode can't take the page down: if its rows can't be read, its charts are empty and a warning shows.
  const lc = latestRes.data as { calendar: Record<string, number>; recent: { title: string; slug: string; at: string }[]; updated_at: string } | null;

  const grid = yearHeatmap(Object.fromEntries(logs.map((l) => [l.date, Number(l.study_hours)])), today);
  const days = grid.flat().filter((d) => d !== null);
  const yearHours = Math.round(days.reduce((sum, d) => sum + d.value, 0) * 10) / 10;
  const activeDays = days.filter((d) => d.value > 0).length;
  const weeks = weeklyHours(logs, today);
  const best = Math.max(...weeks.map((w) => w.hours));
  const leetcode = leetcodeSeries(seriesRes.data ?? [], today);
  const lcGrid = yearHeatmap(lc?.calendar ?? {}, today);
  const submissions = lcGrid.flat().reduce((sum, d) => sum + (d?.value ?? 0), 0);

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl">Activity</h1>
        <p className="font-mono text-xs text-graphite">
          last 12 months · {yearHours} h studied · {activeDays} active {activeDays === 1 ? "day" : "days"} ·{" "}
          {leetcode.at(-1)!.total}/{targets.leetcode_total} leetcode{lc && <> · synced {timeAgo(lc.updated_at)}</>}
        </p>
        <LeetcodeWarning syncedAt={lc?.updated_at} unreadable={!!(seriesRes.error || latestRes.error)} />
        {logs.length === 0 && (
          <p className="text-graphite">Nothing logged yet. Your study hours fill these charts after your first log (press L).</p>
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
          {lc && lc.recent.length > 0 && (
            <ol className="flex flex-col gap-1.5 font-mono text-xs leading-5" aria-label="Recent LeetCode solves">
              {lc.recent.slice(0, 5).map((r) => (
                <li key={r.at + r.slug} className="truncate">
                  <span className="text-graphite">[{dhakaDate(new Date(r.at)).slice(5)}]</span>{" "}
                  <a href={`https://leetcode.com/problems/${r.slug}/`} target="_blank" rel="noreferrer" className="underline decoration-graphite/60 underline-offset-4 hover:decoration-ink">
                    {r.title}
                  </a>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-4">
        <SectionHead title="LeetCode submissions by day" note={`last 12 months · ${submissions} submissions · UTC days`} />
        {lc ? <Heatmap grid={lcGrid} kind="leetcode" /> : <p className="text-sm text-graphite">Fills in after the first LeetCode sync (Sync now on the dashboard).</p>}
      </section>
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
