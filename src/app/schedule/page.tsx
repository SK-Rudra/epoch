import { Suspense } from "react";
import { dhakaDate, dhakaTime } from "@/lib/dates";
import { DAYS, Schedule, dayPlan, type BlockState } from "@/lib/schedule";
import { requireUser } from "@/lib/supabase/server";

export const metadata = { title: "Schedule" };

export default function SchedulePage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <SchedulePlan />
      </Suspense>
    </main>
  );
}

async function SchedulePlan() {
  const { supabase } = await requireUser();
  const { data: row, error } = await supabase.from("schedule").select("data").maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return <p className="text-muted">No schedule yet. Run the seed script.</p>;

  // The column is plain JSON, so check its shape before trusting it.
  const parsed = Schedule.safeParse(row.data);
  if (!parsed.success) return <p className="text-red-500">Saved schedule is invalid: {parsed.error.issues[0].message}</p>;
  const schedule = parsed.data;

  // ponytail: "now" is when the page loaded; reload to move the highlight. Add a client clock if that gets annoying.
  const time = dhakaTime();
  const today = dayPlan(schedule, dhakaDate(), time);
  const kindLabel = today.kind === "class" ? "Class day" : today.kind === "off" ? "Off day" : "Free day";

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <p className="text-sm text-muted">{today.day} · {kindLabel} · now {time}</p>
      </header>

      <ol className="grid grid-cols-7 gap-1 text-center text-xs" aria-label="This week">
        {DAYS.map((d) => (
          <li key={d} aria-current={d === today.day ? "date" : undefined}
            className="flex flex-col rounded-lg border border-line py-2 aria-[current=date]:bg-foreground aria-[current=date]:text-background">
            <span className="font-semibold">{d}</span>
            <span className="opacity-70">{schedule.class_days.includes(d) ? "Class" : schedule.off_days.includes(d) ? "Off" : "—"}</span>
          </li>
        ))}
      </ol>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Today</h2>
        {today.blocks.length === 0 ? (
          <p className="text-sm text-muted">Nothing planned today.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {today.blocks.map((b) => <BlockRow key={b.start} {...b} />)}
          </ol>
        )}
      </section>

      {/* The other kind of day, for reference. */}
      {today.kind !== "class" && <Plan title="Class days" blocks={schedule.class_day_blocks} />}
      {today.kind !== "off" && <Plan title="Off days" blocks={schedule.off_day_blocks} />}
    </div>
  );
}

type Block = { start: string; end: string; label: string };

const stateStyle: Record<BlockState, string> = {
  past: "border-line text-muted line-through decoration-muted/50",
  now: "border-emerald-500 bg-emerald-500/10",
  upcoming: "border-line",
};

function BlockRow({ start, end, label, state }: Block & { state?: BlockState }) {
  return (
    <li aria-current={state === "now" ? "time" : undefined}
      className={`flex items-baseline gap-3 rounded-lg border px-3 py-2 ${stateStyle[state ?? "upcoming"]}`}>
      <span className="shrink-0 font-mono text-sm tabular-nums">{start}–{end}</span>
      <span className="flex-1">{label}</span>
      {state === "now" && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">NOW</span>}
    </li>
  );
}

function Plan({ title, blocks }: { title: string; blocks: Block[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-muted">{title}</h2>
      <ol className="flex flex-col gap-2 opacity-70">
        {blocks.map((b) => <BlockRow key={b.start} {...b} />)}
      </ol>
    </section>
  );
}
