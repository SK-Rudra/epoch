"use client";

import { useSyncExternalStore } from "react";
import { dhakaTime } from "@/lib/dates";
import { blockState, duration, minutes, type BlockState } from "@/lib/time";

type Block = { start: string; end: string; label: string };

const every30s = (tick: () => void) => {
  const id = setInterval(tick, 30_000);
  return () => clearInterval(id);
};

/**
 * Today's timetable with a live "now". The server's time is used for the first render (so server and
 * browser agree), then the browser's Dhaka clock takes over and re-checks every 30 seconds.
 * ponytail: doesn't roll over to tomorrow's plan at midnight; reload the page for that.
 */
export function Today({ day, kind, blocks, serverTime }: { day: string; kind: string; blocks: Block[]; serverTime: string }) {
  const time = useSyncExternalStore(every30s, () => dhakaTime(), () => serverTime);
  const states = blocks.map((b) => blockState(b, time));
  const inBlock = states.includes("now");
  // Between blocks (or before/after all of them): a "now" line goes before the first upcoming block.
  const nowLineAt = inBlock ? -1 : (states.indexOf("upcoming") + blocks.length + 1) % (blocks.length + 1);

  return (
    <section className="flex flex-col gap-4">
      <p className="font-mono text-xs text-graphite">
        {day} · {kind} · <time>{time}</time> Dhaka
      </p>
      {blocks.length === 0 ? (
        <p className="text-graphite">Nothing planned today. Enjoy the break.</p>
      ) : (
        <ol className="flex flex-col">
          {blocks.map((b, i) => (
            <li key={b.start} className="contents">
              {nowLineAt === i && <NowLine time={time} />}
              <BlockRow {...b} state={states[i]} time={time} />
            </li>
          ))}
          {nowLineAt === blocks.length && <NowLine time={time} />}
        </ol>
      )}
    </section>
  );
}

const rowStyle: Record<BlockState, string> = {
  past: "text-graphite",
  now: "border-l-2 border-l-plot bg-plot/[0.06] pl-3",
  upcoming: "",
};

function BlockRow({ start, end, label, state, time }: Block & { state: BlockState; time: string }) {
  const elapsed = state === "now" ? (minutes(time) - minutes(start)) / (minutes(end) - minutes(start)) : 0;
  return (
    <div
      aria-current={state === "now" ? "time" : undefined}
      className={`grid grid-cols-[6.75rem_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-grid py-3 transition-colors duration-300 ${rowStyle[state]}`}
    >
      <span className="font-mono text-sm">{start}–{end}</span>
      <span className={state === "past" ? "line-through decoration-graphite/60" : ""}>{label}</span>
      <span className="font-mono text-xs text-graphite">
        {state === "now" ? <span className="text-plot">now</span> : duration(start, end)}
      </span>
      {state === "now" && (
        // How far through the current block we are.
        <span aria-hidden className="col-span-3 mt-2 block h-[3px] overflow-hidden rounded-full bg-grid">
          <span className="block h-full origin-left bg-plot transition-transform duration-300" style={{ transform: `scaleX(${elapsed})` }} />
        </span>
      )}
    </div>
  );
}

// Shown between blocks when no block is running right now.
function NowLine({ time }: { time: string }) {
  return (
    <div aria-label={`Now, ${time}, between blocks`} className="flex items-center gap-2 py-1.5 font-mono text-xs text-plot">
      <span className="size-1.5 rounded-full bg-plot" aria-hidden />
      {time}
      <span className="h-px flex-1 bg-plot/60" aria-hidden />
    </div>
  );
}
