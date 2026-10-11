import { Suspense } from "react";
import { cumulativeLeetcode, heatLevel, weeklyHours, yearHeatmap, type HeatDay } from "@/lib/activity";
import { dhakaDate } from "@/lib/dates";
import { requireUser } from "@/lib/supabase/server";
import { targets } from "../../../data/roadmap-seed.json";

export const metadata = { title: "Activity" };

export default function ActivityPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
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
  const yearHours = grid.flat().reduce((sum, d) => sum + (d?.hours ?? 0), 0);
  const leetcode = cumulativeLeetcode(logs, today);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Activity</h1>

      <Section title="Study, last 12 months" note={`${Math.round(yearHours)} h total`}>
        <Heatmap grid={grid} />
      </Section>

      <Section title="Hours per week" note="last 12 weeks">
        <WeeklyBars weeks={weeklyHours(logs, today)} />
      </Section>

      <Section title="LeetCode solved" note={`${leetcode.at(-1)!.total} / ${targets.leetcode_total}`}>
        <LeetcodeLine points={leetcode} />
      </Section>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-muted">{note}</span>
      </div>
      {children}
    </section>
  );
}

const shortDate = (date: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });

// Empty days use the border colour; study days get stronger green the more hours.
const levelFill = ["fill-line", "fill-emerald-500/30", "fill-emerald-500/55", "fill-emerald-500/80", "fill-emerald-500"];

// The SVG scales to the screen width, so on a 400px phone each cell is ~6px.
function Heatmap({ grid }: { grid: HeatDay[][] }) {
  const step = 12;
  const top = 14; // room for month labels
  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${grid.length * step} ${top + 7 * step}`} className="w-full" role="img" aria-label="Daily study hours heatmap for the last 12 months">
        {grid.map((week, w) => {
          const first = week[0]!.date;
          const newMonth = w > 0 && first.slice(5, 7) !== grid[w - 1][0]!.date.slice(5, 7);
          return (
            <g key={first}>
              {newMonth && w < grid.length - 2 && (
                <text x={w * step} y={10} className="fill-muted text-[10px]">{shortDate(first, { month: "short" })}</text>
              )}
              {week.map((day, d) =>
                day && (
                  <rect key={day.date} x={w * step} y={top + d * step} width={10} height={10} rx={2} className={levelFill[heatLevel(day.hours)]}>
                    <title>{`${shortDate(day.date, { month: "short", day: "numeric", year: "numeric" })}: ${day.hours} h`}</title>
                  </rect>
                ),
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-end gap-1 text-xs text-muted">
        Less
        {levelFill.map((c) => (
          <svg key={c} viewBox="0 0 10 10" className="size-3"><rect width={10} height={10} rx={2} className={c} /></svg>
        ))}
        More
      </div>
    </div>
  );
}

function WeeklyBars({ weeks }: { weeks: { week: string; hours: number }[] }) {
  const w = 360, h = 150, base = 130, step = w / weeks.length;
  const max = Math.max(1, ...weeks.map((x) => x.hours));
  const best = weeks.reduce((a, b) => (b.hours > a.hours ? b : a));
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Study hours per week for the last 12 weeks">
      <line x1={0} x2={w} y1={base} y2={base} className="stroke-line" />
      {weeks.map((x, i) => {
        const bh = (x.hours / max) * (base - 20);
        const cx = i * step + step / 2;
        // Label only this week and the best week, so the chart stays readable.
        const label = x.hours > 0 && (i === weeks.length - 1 || x === best);
        return (
          <g key={x.week}>
            <rect x={i * step} y={0} width={step} height={h} fill="transparent">
              <title>{`Week of ${shortDate(x.week)}: ${x.hours} h`}</title>
            </rect>
            {bh > 0 && <rect x={cx - 10} y={base - bh} width={20} height={bh} rx={3} className="pointer-events-none fill-emerald-500" />}
            {label && <text x={cx} y={base - bh - 5} textAnchor="middle" className="pointer-events-none fill-foreground text-[11px]">{x.hours}</text>}
            {i % 2 === 1 && <text x={cx} y={h - 4} textAnchor="middle" className="fill-muted text-[10px]">{shortDate(x.week)}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function LeetcodeLine({ points }: { points: { date: string; total: number }[] }) {
  const w = 360, h = 150, left = 30, right = 8, top = 10, base = 130;
  const max = Math.max(1, points.at(-1)!.total);
  const x = (i: number) => left + (points.length === 1 ? (w - left - right) : (i / (points.length - 1)) * (w - left - right));
  const y = (total: number) => base - (total / max) * (base - top);
  const slot = (w - left - right) / points.length;
  const last = points.at(-1)!;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={`Cumulative LeetCode problems solved, now ${last.total}`}>
      <line x1={left} x2={w - right} y1={base} y2={base} className="stroke-line" />
      <line x1={left} x2={w - right} y1={top} y2={top} className="stroke-line" strokeDasharray="3 3" />
      <text x={left - 6} y={base + 4} textAnchor="end" className="fill-muted text-[10px]">0</text>
      <text x={left - 6} y={top + 4} textAnchor="end" className="fill-muted text-[10px]">{max}</text>
      <text x={left} y={h - 4} className="fill-muted text-[10px]">{shortDate(points[0].date)}</text>
      <text x={w - right} y={h - 4} textAnchor="end" className="fill-muted text-[10px]">{shortDate(last.date)}</text>
      <polyline
        points={points.map((p, i) => `${x(i)},${y(p.total)}`).join(" ")}
        fill="none"
        strokeWidth={2}
        strokeLinejoin="round"
        className="stroke-emerald-500"
      />
      <circle cx={x(points.length - 1)} cy={y(last.total)} r={4} className="fill-emerald-500 stroke-background" strokeWidth={2} />
      {/* Invisible column per day so hovering anywhere shows that day's total. */}
      {points.map((p, i) => (
        <rect key={p.date} x={x(i) - slot / 2} y={top} width={slot} height={base - top} fill="transparent">
          <title>{`${shortDate(p.date)}: ${p.total} solved`}</title>
        </rect>
      ))}
    </svg>
  );
}
