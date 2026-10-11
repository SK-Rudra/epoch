import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight, FolderGit2, Globe } from "lucide-react";
import { ProgressBar } from "@/components/progress-bar";
import { SectionHead } from "@/components/section-head";
import { dhakaDate } from "@/lib/dates";
import { phaseProgress, type Status } from "@/lib/progress";
import { PHASE_SHORT, phaseClock } from "@/lib/run";
import { requireUser } from "@/lib/supabase/server";
import { GoalList, StatusChip } from "./items";

// Shape of the one query below (columns from supabase/migrations/0001_init.sql).
type PhaseRow = {
  number: number;
  title: string;
  role_name: string;
  start_date: string;
  end_date: string;
  summary: string;
  skills: { id: string; main_skill: string; sub_skills: string; status: Status }[];
  courses: { id: string; name: string; provider: string; url: string; time_slot: string; status: Status }[];
  projects: {
    id: string;
    rank: number;
    name: string;
    problem_solved: string;
    stack: string;
    live_url: string;
    repo_url: string;
    status: Status;
  }[];
  goals: { id: string; text: string; done: boolean }[];
};

const phaseNumber = async (params: PageProps<"/phases/[number]">["params"]) => {
  const n = Number((await params).number);
  return Number.isInteger(n) && n >= 1 && n <= 6 ? n : null;
};

// Browser tab: "E3 ML Eng · Epoch"
export async function generateMetadata({ params }: PageProps<"/phases/[number]">): Promise<Metadata> {
  const n = await phaseNumber(params);
  return { title: n ? `E${n} ${PHASE_SHORT[n - 1]}` : "Not found" };
}

export default function PhasePage({ params }: PageProps<"/phases/[number]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-8 md:py-10">
      <Suspense fallback={<PhaseSkeleton />}>
        <Phase params={params} />
      </Suspense>
    </main>
  );
}

async function Phase({ params }: Pick<PageProps<"/phases/[number]">, "params">) {
  const number = await phaseNumber(params);
  if (!number) notFound();

  const { supabase } = await requireUser();
  const { data: phase, error } = await supabase
    .from("phases")
    .select("*, skills(*), courses(*), projects(*), goals(*)")
    .eq("number", number)
    .order("created_at", { referencedTable: "skills" })
    .order("created_at", { referencedTable: "courses" })
    .order("rank", { referencedTable: "projects" })
    .order("created_at", { referencedTable: "goals" })
    .maybeSingle<PhaseRow>();
  if (error) throw new Error(error.message);
  if (!phase) notFound();

  const progress = phaseProgress(phase);

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs text-graphite">
          epoch {phase.number}/6 · {phase.start_date} → {phase.end_date} · {phaseClock(phase, dhakaDate())}
        </p>
        <h1 className="text-2xl text-balance md:text-3xl">{phase.title}</h1>
        {phase.role_name && <p className="text-graphite">Target role: {phase.role_name}</p>}
        {phase.summary && <p className="max-w-prose">{phase.summary}</p>}
        <div className="mt-3 flex items-center gap-4">
          <ProgressBar label="Phase progress" value={progress} className="h-1 flex-1" />
          <span className="font-mono text-sm">{progress}%</span>
        </div>
      </header>

      <Section title="Skills" items={phase.skills}>
        {phase.skills.map((s) => (
          <Row key={s.id} chip={<StatusChip table="skills" id={s.id} status={s.status} />}>
            <p className="font-medium">{s.main_skill}</p>
            {s.sub_skills && <p className="text-sm text-graphite">{s.sub_skills}</p>}
          </Row>
        ))}
      </Section>

      <Section title="Courses" items={phase.courses}>
        {phase.courses.map((c) => (
          <Row key={c.id} chip={<StatusChip table="courses" id={c.id} status={c.status} />}>
            <ExternalLink href={c.url} className="font-medium">
              {c.name}
              {c.url && <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden className="ml-0.5 inline align-[-1px] text-graphite" />}
            </ExternalLink>
            <p className="text-sm text-graphite">{[c.provider, c.time_slot].filter(Boolean).join(" · ")}</p>
          </Row>
        ))}
      </Section>

      <Section title="Projects" items={phase.projects}>
        {phase.projects.map((p) => (
          <Row key={p.id} chip={<StatusChip table="projects" id={p.id} status={p.status} />}>
            <p className="font-medium">
              <span className="mr-2 font-mono text-sm text-graphite">#{p.rank}</span>
              {p.name}
            </p>
            {p.problem_solved && <p className="text-sm text-graphite">{p.problem_solved}</p>}
            {p.stack && <p className="font-mono text-xs text-graphite">{p.stack}</p>}
            {(p.live_url || p.repo_url) && (
              <p className="mt-1 flex gap-4 text-sm">
                {p.live_url && (
                  <ExternalLink href={p.live_url} className="inline-flex items-center gap-1">
                    <Globe size={14} strokeWidth={1.75} aria-hidden /> Live
                  </ExternalLink>
                )}
                {p.repo_url && (
                  <ExternalLink href={p.repo_url} className="inline-flex items-center gap-1">
                    <FolderGit2 size={14} strokeWidth={1.75} aria-hidden /> Repo
                  </ExternalLink>
                )}
              </p>
            )}
          </Row>
        ))}
      </Section>

      <section className="flex flex-col gap-2">
        <SectionHead title="Goals" note={`${phase.goals.filter((g) => g.done).length}/${phase.goals.length} done`} />
        {phase.goals.length ? <GoalList goals={phase.goals} /> : <Empty what="goals" />}
      </section>
    </div>
  );
}

// Ruled list instead of a table: reads well at 400px without sideways scrolling.
function Section({ title, items, children }: { title: string; items: { status: Status }[]; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <SectionHead title={title} note={`${items.filter((i) => i.status === "done").length}/${items.length} done`} />
      {items.length ? <ul className="flex flex-col">{children}</ul> : <Empty what={title.toLowerCase()} />}
    </section>
  );
}

function Row({ chip, children }: { chip: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1 border-b border-grid py-3">
      <div className="flex flex-col gap-0.5">{children}</div>
      {chip}
    </li>
  );
}

function Empty({ what }: { what: string }) {
  return <p className="py-3 text-sm text-graphite">No {what} in this phase. Add them to data/roadmap-seed.json and re-run the seed.</p>;
}

function ExternalLink({ href, className = "", children }: { href: string; className?: string; children: React.ReactNode }) {
  if (!href) return <span className={className}>{children}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`underline decoration-graphite/60 underline-offset-4 transition-colors hover:decoration-ink ${className}`}
    >
      {children}
    </a>
  );
}

// Same shapes as the real page so nothing jumps when it loads.
function PhaseSkeleton() {
  const block = "animate-pulse rounded bg-grid/70";
  return (
    <div className="flex flex-col gap-12" aria-busy="true" aria-label="Loading phase">
      <div className="flex flex-col gap-3">
        <div className={`${block} h-4 w-80 max-w-full`} />
        <div className={`${block} h-9 w-2/3`} />
        <div className={`${block} h-5 w-1/3`} />
        <div className={`${block} h-12 w-full`} />
        <div className={`${block} mt-3 h-2 w-full`} />
      </div>
      {[0, 1].map((s) => (
        <div key={s} className="flex flex-col gap-3">
          <div className={`${block} h-7 w-32`} />
          {[0, 1, 2].map((r) => <div key={r} className={`${block} h-14`} />)}
        </div>
      ))}
    </div>
  );
}
