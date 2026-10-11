import { Suspense } from "react";
import { SectionHead } from "@/components/section-head";
import { dhakaDate, dhakaTime } from "@/lib/dates";
import { DAYS, Schedule, dayPlan } from "@/lib/schedule";
import { duration } from "@/lib/time";
import { requireUser } from "@/lib/supabase/server";
import { Today } from "./today";

export const metadata = { title: "Schedule" };

export default function SchedulePage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-8 md:py-10">
      <Suspense fallback={<ScheduleSkeleton />}>
        <SchedulePlan />
      </Suspense>
    </main>
  );
}

async function SchedulePlan() {
  const { supabase } = await requireUser();
  const { data: row, error } = await supabase.from("schedule").select("data").maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) {
    return (
      <Notice title="No schedule yet">
        Run <code className="font-mono text-ink">npm run seed</code> once to load your timetable, then reload this page.
      </Notice>
    );
  }

  // The column is plain JSON, so check its shape before trusting it.
  const parsed = Schedule.safeParse(row.data);
  if (!parsed.success) {
    return (
      <Notice title="Saved schedule is invalid">
        <span className="text-fault">{parsed.error.issues[0].message}</span>. Fix the schedule in data/roadmap-seed.json and re-run the seed.
      </Notice>
    );
  }
  const schedule = parsed.data;

  const time = dhakaTime();
  const today = dayPlan(schedule, dhakaDate(), time);
  const kindLabel = today.kind === "class" ? "class day" : today.kind === "off" ? "off day" : "free day";

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-6">
        <h1 className="text-2xl md:text-3xl">Schedule</h1>

        {/* Week strip. Day type by shape too: class = solid bar, off = hollow bar, free = none. */}
        <ol className="grid grid-cols-7 gap-1 text-center" aria-label="This week">
          {DAYS.map((d) => {
            const kind = schedule.class_days.includes(d) ? "Class" : schedule.off_days.includes(d) ? "Off" : "Free";
            return (
              <li
                key={d}
                aria-current={d === today.day ? "date" : undefined}
                className="flex flex-col items-center gap-1.5 rounded-md py-2 aria-[current=date]:bg-ink aria-[current=date]:text-paper"
              >
                <span className="text-sm font-medium">{d}</span>
                <span
                  aria-hidden
                  className={`h-1 w-5 rounded-full ${kind === "Class" ? "bg-plot" : kind === "Off" ? "border border-current opacity-70" : ""}`}
                />
                <span className="text-xs opacity-75">{kind}</span>
              </li>
            );
          })}
        </ol>
      </header>

      <Today day={today.day} kind={kindLabel} blocks={today.blocks} serverTime={time} />

      {/* The other kind of day, for reference. */}
      {today.kind !== "class" && <Plan title="Class days" blocks={schedule.class_day_blocks} />}
      {today.kind !== "off" && <Plan title="Off days" blocks={schedule.off_day_blocks} />}
    </div>
  );
}

type Block = { start: string; end: string; label: string };

function Plan({ title, blocks }: { title: string; blocks: Block[] }) {
  return (
    <section className="flex flex-col">
      <SectionHead title={title} note={`${blocks.length} blocks`} />
      <ol className="flex flex-col text-graphite">
        {blocks.map((b) => (
          <li key={b.start} className="grid grid-cols-[6.75rem_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-grid py-2.5">
            <span className="font-mono text-sm">{b.start}–{b.end}</span>
            <span>{b.label}</span>
            <span className="font-mono text-xs">{duration(b.start, b.end)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex max-w-prose flex-col gap-2">
      <h1 className="text-2xl">{title}</h1>
      <p className="text-graphite">{children}</p>
    </div>
  );
}

// Same shapes as the real page so nothing jumps when it loads.
function ScheduleSkeleton() {
  const block = "animate-pulse rounded bg-grid/70";
  return (
    <div className="flex flex-col gap-12" aria-busy="true" aria-label="Loading schedule">
      <div className="flex flex-col gap-6">
        <div className={`${block} h-9 w-44`} />
        <div className={`${block} h-[4.5rem]`} />
      </div>
      <div className="flex flex-col gap-3">
        <div className={`${block} h-4 w-56`} />
        {[0, 1, 2, 3].map((i) => <div key={i} className={`${block} h-12`} />)}
      </div>
    </div>
  );
}
