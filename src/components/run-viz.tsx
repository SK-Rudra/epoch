"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { motion } from "motion/react";

// ---------- Run clock: "T+ 11d 14:02:33" since the run started (midnight in Dhaka) ----------

const everySecond = (tick: () => void) => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
};
const nowSeconds = () => Math.floor(Date.now() / 1000);
const pad = (n: number) => String(n).padStart(2, "0");

export function RunClock({ start }: { start: string }) {
  // null on the server: the time is only known in the browser. Placeholder has the same width, so nothing shifts.
  const now = useSyncExternalStore(everySecond, nowSeconds, () => null);
  let text = "T+ --d --:--:--";
  if (now !== null) {
    const diff = now - Date.parse(`${start}T00:00:00+06:00`) / 1000;
    const s = Math.abs(diff);
    text = `T${diff < 0 ? "−" : "+"} ${Math.floor(s / 86400)}d ${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
  }
  return (
    <span role="timer" aria-live="off" title="Time since the run started" className="font-mono">
      {text}
    </span>
  );
}

// ---------- Run timeline: every epoch on one bar, widths by length, checkpoints between, cursor at today ----------

export type TimelineSegment = { number: number; title: string; offset: number; width: number; progress: number };

/** today/current = null: decorative version (login page) with no links and no today cursor. */
export function RunTimeline({ segments, today, current }: { segments: TimelineSegment[]; today: number | null; current: number | null }) {
  const decorative = today === null;
  return (
    <div className="relative pt-5 pb-1" aria-hidden={decorative || undefined}>
      <ol aria-label="Run timeline" className="relative h-2">
        {segments.map((s, i) => {
          const done = s.progress === 100;
          return (
            <li key={s.number} className="absolute inset-y-0" style={{ left: `${s.offset * 100}%`, width: `${s.width * 100}%` }}>
              <SegmentLink
                href={decorative ? null : `/phases/${s.number}`}
                label={`Epoch ${s.number}: ${s.title}, ${s.progress}% complete`}
              >
                <span
                  aria-hidden
                  className={`absolute -top-0 left-0 font-mono text-xs transition-colors group-hover:text-ink ${s.number === current ? "text-ink" : "text-graphite"}`}
                >
                  E{s.number}
                </span>
                <span aria-hidden className={`absolute inset-x-0 top-5 mr-[3px] h-2 overflow-hidden rounded-[2px] bg-grid ${decorative ? "opacity-50" : ""}`}>
                  <motion.span
                    className="block h-full origin-left bg-plot"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: s.progress / 100 }}
                    transition={{ duration: 0.3, delay: 0.1 + i * 0.04 }}
                  />
                </span>
              </SegmentLink>
              {/* Checkpoint at the end of each epoch: filled once every item in it is done. */}
              <span
                aria-hidden
                className={`pointer-events-none absolute top-1/2 right-0 z-10 size-[7px] translate-x-[2px] -translate-y-1/2 rotate-45 border ${done ? "border-ink bg-ink" : "border-graphite bg-paper"} ${decorative ? "opacity-50" : ""}`}
              />
            </li>
          );
        })}
      </ol>
      {/* Today cursor */}
      {!decorative && <span aria-hidden className="pointer-events-none absolute top-4 bottom-0 w-px bg-ink" style={{ left: `${today * 100}%` }} />}
    </div>
  );
}

// Taller invisible hit area than the 8px bar, so it's easy to tap. A plain span when decorative.
function SegmentLink({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  const cls = "group absolute -inset-y-5 inset-x-0 focus-visible:outline-offset-0";
  if (!href) return <span className={cls}>{children}</span>;
  return <Link href={href} aria-label={label} className={cls}>{children}</Link>;
}

// ---------- LeetCode sparkline with a dashed target line ----------

export function Sparkline({ points, target }: { points: number[]; target: number }) {
  const max = Math.max(target, ...points);
  const x = (i: number) => (points.length === 1 ? 100 : (i / (points.length - 1)) * 100);
  const y = (v: number) => 30 - (v / max) * 28; // 2px headroom at the top of a 32-unit box
  const last = points.at(-1) ?? 0;
  return (
    <div className="relative h-8">
      {/* preserveAspectRatio="none" stretches the chart to the column; non-scaling-stroke keeps lines 1.5px. */}
      <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <line x1={0} x2={100} y1={y(target)} y2={y(target)} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" className="stroke-graphite" />
        <motion.polyline
          points={points.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
          fill="none"
          strokeWidth={1.5}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className="stroke-plot"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        />
      </svg>
      {/* Latest point as an HTML dot so the stretched SVG can't squash it into an oval. */}
      <span
        aria-hidden
        className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-plot ring-2 ring-paper"
        style={{ left: `${x(points.length - 1)}%`, top: `${(y(last) / 32) * 100}%` }}
      />
      <span aria-hidden className="absolute -top-2.5 right-0 bg-paper pl-1 font-mono text-[11px] text-graphite">
        target {target}
      </span>
    </div>
  );
}

// ---------- Study uptime: last 30 days, one cell per day ----------

export function UptimeStrip({ days }: { days: { date: string; studied: boolean }[] }) {
  const studied = days.filter((d) => d.studied).length;
  return (
    <div role="img" aria-label={`Studied on ${studied} of the last ${days.length} days`} className="flex h-3 gap-[2px]">
      {days.map((d, i) => (
        <span
          key={d.date}
          title={`${d.date}: ${d.studied ? "studied" : "no study"}`}
          className={`flex-1 rounded-[1px] ${
            d.studied
              ? "bg-plot"
              : i === days.length - 1
                ? "border border-dashed border-graphite/80" // today, not logged yet
                : "bg-grid"
          }`}
        />
      ))}
    </div>
  );
}
