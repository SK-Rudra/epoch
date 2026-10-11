"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { heatLevel, niceTicks, type HeatDay } from "@/lib/activity";

// Charts draw shapes in SVG but put all text in HTML, so labels stay readable at any screen width.

const shortDate = (date: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });

/**
 * Which item the reader is looking at: set by hovering, or by focusing the chart (Tab) and using arrow keys.
 * steps maps a key to how far it moves (the heatmap moves a week with ←/→ and a day with ↑/↓).
 */
function useCursor(n: number, steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 }) {
  const [index, setIndex] = useState<number | null>(null);
  const clamp = (i: number) => Math.min(Math.max(i, 0), n - 1);
  const props = {
    tabIndex: 0,
    onFocus: () => setIndex(n - 1),
    onBlur: () => setIndex(null),
    onPointerLeave: () => setIndex(null),
    onKeyDown: (e: React.KeyboardEvent) => {
      const move = steps[e.key];
      if (move === undefined && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      setIndex((i) => (e.key === "Home" ? 0 : e.key === "End" ? n - 1 : clamp((i ?? n - 1) + move)));
    },
    className: "relative cursor-crosshair rounded-sm focus-visible:outline-offset-4",
  };
  return [index, setIndex, props] as const;
}

/** Pointer position inside the element, as 0–1 fractions. */
const fraction = (e: React.PointerEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  return { fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height };
};

/** Small dark label above a point; x and y are % of the plot area. Kept inside the chart near the edges. */
function Tip({ x, y, children }: { x: number; y: number; children: React.ReactNode }) {
  const align = x < 15 ? "translate-x-0" : x > 85 ? "-translate-x-full" : "-translate-x-1/2";
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute z-10 ${align} -translate-y-[calc(100%+8px)] rounded bg-ink px-2 py-1 font-mono text-xs whitespace-nowrap text-paper`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {children}
    </div>
  );
}

/** Screen readers hear the tooltip text as the cursor moves. */
const Announce = ({ text }: { text: string }) => (
  <p className="sr-only" aria-live="polite">{text}</p>
);

const axisText = "font-mono text-[11px] text-graphite";

// ---------- Heatmap: one cell per day, a column per week ----------

const levelFill = ["fill-grid", "fill-plot/25", "fill-plot/45", "fill-plot/70", "fill-plot"];

// What a heatmap counts. steps = top of colour levels 1–3, legend matches them.
const HEAT = {
  study: {
    steps: [1, 2, 4],
    legend: ["0", "≤1h", "≤2h", "≤4h", "4h+"],
    tip: (v: number) => `${v} h`,
    say: (v: number) => `${v} hours`,
    label: "Study hours per day for the last 12 months.",
  },
  leetcode: {
    steps: [1, 3, 6],
    legend: ["0", "1", "2–3", "4–6", "7+"],
    tip: (v: number) => `${v} sub${v === 1 ? "" : "s"}`,
    say: (v: number) => `${v} LeetCode submissions`,
    label: "LeetCode submissions per day for the last 12 months.",
  },
};

export function Heatmap({ grid, kind = "study" }: { grid: HeatDay[][]; kind?: keyof typeof HEAT }) {
  const heat = HEAT[kind];
  const days = grid.flat(); // index = week * 7 + weekday
  const last = days.findLastIndex(Boolean); // today
  const [i, setI, cursor] = useCursor(last + 1, { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 });
  const cur = i === null ? null : days[i];
  const step = 12;

  // Month name over the first week of each month, skipping ones that would collide.
  const months: { w: number; label: string }[] = [];
  grid.forEach((week, w) => {
    const first = week[0]!.date;
    if ((w === 0 || first.slice(5, 7) !== grid[w - 1][0]!.date.slice(5, 7)) && w < grid.length - 2 && (months.at(-1)?.w ?? -9) < w - 3) {
      months.push({ w, label: shortDate(first, { month: "short" }) });
    }
  });

  return (
    <div className="flex max-w-[56rem] flex-col gap-3">
      <div className="grid grid-cols-[2.25rem_minmax(0,1fr)]">
        <div />
        <div className={`relative h-5 ${axisText}`}>
          {months.map((m) => (
            <span key={m.w} className="absolute" style={{ left: `${(m.w / grid.length) * 100}%` }}>{m.label}</span>
          ))}
        </div>
        <div className={`grid grid-rows-7 ${axisText}`} aria-hidden>
          {["", "Mon", "", "Wed", "", "Fri", ""].map((d, k) => <span key={k} className="flex items-center leading-none">{d}</span>)}
        </div>
        <div
          {...cursor}
          role="group"
          aria-label={`${heat.label} Use the arrow keys to move between days.`}
          onPointerMove={(e) => {
            const { fx, fy } = fraction(e);
            const k = Math.floor(fx * grid.length) * 7 + Math.floor(fy * 7);
            if (k >= 0 && k <= last && days[k]) setI(k);
          }}
        >
          <svg viewBox={`0 0 ${grid.length * step} ${7 * step}`} className="block w-full" aria-hidden>
            {grid.map((week, w) => (
              // Columns fade in one week after another (~320ms for the whole year).
              <motion.g key={week[0]!.date} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15, delay: w * 0.006 }}>
                {week.map((day, d) =>
                  day && <rect key={day.date} x={w * step + 1} y={d * step + 1} width={10} height={10} rx={2} className={levelFill[heatLevel(day.value, heat.steps)]} />,
                )}
              </motion.g>
            ))}
            {i !== null && (
              <rect x={Math.floor(i / 7) * step + 0.5} y={(i % 7) * step + 0.5} width={11} height={11} rx={2.5} className="fill-none stroke-ink" strokeWidth={1.5} />
            )}
          </svg>
          {cur && (
            <Tip x={((Math.floor(i! / 7) + 0.5) / grid.length) * 100} y={((i! % 7) / 7) * 100}>
              {shortDate(cur.date, { weekday: "short", month: "short", day: "numeric" })} · {heat.tip(cur.value)}
            </Tip>
          )}
        </div>
      </div>
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 pl-9 ${axisText}`} aria-hidden>
        {levelFill.map((fill, k) => (
          <span key={fill} className="inline-flex items-center gap-1">
            <svg viewBox="0 0 10 10" className="size-2.5"><rect width={10} height={10} rx={2} className={fill} /></svg>
            {heat.legend[k]}
          </span>
        ))}
      </div>
      <Announce text={cur ? `${shortDate(cur.date, { weekday: "long", month: "long", day: "numeric" })}: ${heat.say(cur.value)}` : ""} />
    </div>
  );
}

// ---------- Weekly bars ----------

export function WeeklyBars({ weeks }: { weeks: { week: string; hours: number }[] }) {
  const n = weeks.length;
  const ticks = niceTicks(Math.max(...weeks.map((w) => w.hours)));
  const top = ticks.at(-1)!;
  const [i, setI, cursor] = useCursor(n);

  return (
    <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-y-2">
      <YAxis ticks={ticks} top={top} unit="h" />
      <div {...cursor} role="group" aria-label="Study hours per week, last 12 weeks. Use the arrow keys to move between weeks."
        onPointerMove={(e) => setI(Math.min(Math.floor(fraction(e).fx * n), n - 1))}>
        <div className="relative h-40">
          <Gridlines ticks={ticks} top={top} />
          <div className="absolute inset-0 flex items-end">
            {weeks.map((w, k) => (
              <div key={w.week} className="flex h-full flex-1 items-end justify-center px-[18%]">
                <motion.div
                  // Latest week (and the one being looked at) in full colour, the rest lighter.
                  className={`w-full max-w-6 origin-bottom rounded-t-[2px] transition-colors duration-150 ${k === n - 1 || k === i ? "bg-plot" : "bg-plot/40"}`}
                  style={{ height: `${(w.hours / top) * 100}%` }}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.3, delay: k * 0.02 }}
                />
              </div>
            ))}
          </div>
          {i !== null && <Tip x={((i + 0.5) / n) * 100} y={100 - (weeks[i].hours / top) * 100}>Week of {shortDate(weeks[i].week)} · {weeks[i].hours} h</Tip>}
        </div>
      </div>
      <div />
      <div className={`relative h-4 ${axisText}`} aria-hidden>
        {weeks.map((w, k) => (k % 3 === (n - 1) % 3) && (
          <span key={w.week} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${((k + 0.5) / n) * 100}%` }}>{shortDate(w.week)}</span>
        ))}
      </div>
      <Announce text={i === null ? "" : `Week of ${shortDate(weeks[i].week)}: ${weeks[i].hours} hours`} />
    </div>
  );
}

// ---------- LeetCode cumulative line ----------

export function LeetcodeLine({ points, target }: { points: { date: string; total: number }[]; target: number }) {
  const n = points.length;
  const last = points[n - 1];
  const ticks = niceTicks(Math.max(target, last.total));
  const top = ticks.at(-1)!;
  const x = (k: number) => (n === 1 ? 100 : (k / (n - 1)) * 100);
  const y = (v: number) => 100 - (v / top) * 100;
  const [i, setI, cursor] = useCursor(n);
  const cur = i === null ? null : points[i];

  return (
    <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-y-2">
      <YAxis ticks={ticks} top={top} />
      <div {...cursor} role="group" aria-label={`LeetCode problems solved over time, now ${last.total} of ${target}. Use the arrow keys to move between days.`}
        onPointerMove={(e) => setI(Math.round(fraction(e).fx * (n - 1)))}>
        <div className="relative h-40">
          <Gridlines ticks={ticks} top={top} />
          {/* Target: dashed line with its label */}
          <div className="absolute inset-x-0 border-t border-dashed border-graphite" style={{ top: `${y(target)}%` }}>
            <span className={`absolute right-0 -translate-y-full bg-paper pl-1 ${axisText}`}>target {target}</span>
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
            <motion.polyline
              points={points.map((p, k) => `${x(k)},${y(p.total)}`).join(" ")}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className="stroke-plot"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4 }}
            />
          </svg>
          {cur && <div className="absolute inset-y-0 border-l border-ink/40" style={{ left: `${x(i!)}%` }} />}
          {/* Latest point is always marked; the cursor point too while hovering. */}
          <Dot x={x(n - 1)} y={y(last.total)} />
          {cur && <Dot x={x(i!)} y={y(cur.total)} />}
          {cur
            ? <Tip x={x(i!)} y={y(cur.total)}>{shortDate(cur.date)} · {cur.total} solved</Tip>
            : <span className={`absolute -translate-x-full -translate-y-[calc(100%+6px)] pr-1 font-mono text-xs text-ink`} style={{ left: `${x(n - 1)}%`, top: `${y(last.total)}%` }}>{last.total}</span>}
        </div>
      </div>
      <div />
      <div className={`relative h-4 ${axisText}`} aria-hidden>
        <span className="absolute left-0">{shortDate(points[0].date)}</span>
        {n > 2 && <span className="absolute left-1/2 -translate-x-1/2">{shortDate(points[Math.floor((n - 1) / 2)].date)}</span>}
        <span className="absolute right-0">{shortDate(last.date)}</span>
      </div>
      <Announce text={cur ? `${shortDate(cur.date)}: ${cur.total} solved` : ""} />
    </div>
  );
}

const Dot = ({ x, y }: { x: number; y: number }) => (
  <span aria-hidden className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-plot ring-2 ring-paper" style={{ left: `${x}%`, top: `${y}%` }} />
);

function YAxis({ ticks, top, unit = "" }: { ticks: number[]; top: number; unit?: string }) {
  return (
    <div className={`relative h-40 ${axisText}`} aria-hidden>
      {ticks.map((t) => (
        <span key={t} className="absolute right-2 translate-y-1/2" style={{ bottom: `${(t / top) * 100}%` }}>{t}{unit}</span>
      ))}
    </div>
  );
}

// Faint horizontal lines at each tick.
function Gridlines({ ticks, top }: { ticks: number[]; top: number }) {
  return ticks.map((t) => (
    <div key={t} aria-hidden className="absolute inset-x-0 border-t border-grid" style={{ bottom: `${(t / top) * 100}%` }} />
  ));
}
