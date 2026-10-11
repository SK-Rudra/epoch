import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProgressBar } from "@/components/progress-bar";
import { phaseProgress, type Status } from "@/lib/progress";
import { requireUser } from "@/lib/supabase/server";
import { cycleStatus, toggleGoal } from "./actions";

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

export default function PhasePage({ params }: PageProps<"/phases/[number]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Phase params={params} />
      </Suspense>
    </main>
  );
}

async function Phase({ params }: Pick<PageProps<"/phases/[number]">, "params">) {
  const number = Number((await params).number);
  if (!Number.isInteger(number) || number < 1 || number > 6) notFound();

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
    <div className="flex flex-col gap-8">
      <nav className="flex gap-2 text-sm" aria-label="Phases">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <Link
            key={n}
            href={`/phases/${n}`}
            aria-current={n === number ? "page" : undefined}
            className="rounded-lg border border-line px-3 py-1 aria-[current=page]:bg-foreground aria-[current=page]:text-background"
          >
            {n}
          </Link>
        ))}
      </nav>

      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted">
          Phase {phase.number} · {phase.start_date} → {phase.end_date}
        </p>
        <h1 className="text-2xl font-bold">{phase.title}</h1>
        {phase.role_name && <p className="text-muted">{phase.role_name}</p>}
        {phase.summary && <p>{phase.summary}</p>}
        <div className="mt-2">
          <ProgressBar label="Phase progress" value={progress} />
        </div>
        <p className="text-sm text-muted">{progress}% complete</p>
      </header>

      <Section title="Skills">
        <Table head={["Skill", "Covers", "Status"]}>
          {phase.skills.map((s) => (
            <tr key={s.id}>
              <Td className="font-medium">{s.main_skill}</Td>
              <Td className="text-muted">{s.sub_skills}</Td>
              <Td><StatusChip table="skills" id={s.id} status={s.status} /></Td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="Courses">
        <Table head={["Course", "When", "Status"]}>
          {phase.courses.map((c) => (
            <tr key={c.id}>
              <Td>
                <ExternalLink href={c.url} className="font-medium">{c.name}</ExternalLink>
                {c.provider && <div className="text-sm text-muted">{c.provider}</div>}
              </Td>
              <Td className="text-muted">{c.time_slot}</Td>
              <Td><StatusChip table="courses" id={c.id} status={c.status} /></Td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="Projects">
        <Table head={["#", "Project", "Stack", "Status"]}>
          {phase.projects.map((p) => (
            <tr key={p.id}>
              <Td className="text-muted">{p.rank}</Td>
              <Td>
                <div className="font-medium">{p.name}</div>
                {p.problem_solved && <div className="text-sm text-muted">{p.problem_solved}</div>}
                <div className="flex gap-3 text-sm">
                  {p.live_url && <ExternalLink href={p.live_url}>Live</ExternalLink>}
                  {p.repo_url && <ExternalLink href={p.repo_url}>Repo</ExternalLink>}
                </div>
              </Td>
              <Td className="text-muted">{p.stack}</Td>
              <Td><StatusChip table="projects" id={p.id} status={p.status} /></Td>
            </tr>
          ))}
        </Table>
      </Section>

      <Section title="Goals">
        <ul className="flex flex-col gap-2">
          {phase.goals.map((g) => (
            <li key={g.id}>
              <form action={toggleGoal}>
                <input type="hidden" name="id" value={g.id} />
                <input type="hidden" name="done" value={String(g.done)} />
                <button
                  role="checkbox"
                  aria-checked={g.done}
                  className="flex w-full items-start gap-3 rounded-lg border border-line p-3 text-left"
                >
                  <span aria-hidden className="mt-0.5 grid size-5 shrink-0 place-items-center rounded border border-line">
                    {g.done && "✓"}
                  </span>
                  <span className={g.done ? "text-muted line-through" : ""}>{g.text}</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

// Tables scroll sideways on narrow phones instead of squashing the text.
function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[480px] text-left">
        <thead className="text-sm text-muted">
          <tr>{head.map((h) => <th key={h} className="border-b border-line px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

function Td({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <td className={`px-3 py-2 align-top ${className}`}>{children}</td>;
}

function ExternalLink({ href, className = "", children }: { href: string; className?: string; children: React.ReactNode }) {
  if (!href) return <span className={className}>{children}</span>;
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`underline underline-offset-2 ${className}`}>
      {children}
    </a>
  );
}

const chip: Record<Status, { label: string; className: string }> = {
  not_started: { label: "Not started", className: "border-line text-muted" },
  in_progress: { label: "In progress", className: "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  done: { label: "Done", className: "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
};

// Tap to move to the next status.
function StatusChip({ table, id, status }: { table: "skills" | "courses" | "projects"; id: string; status: Status }) {
  return (
    <form action={cycleStatus}>
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        title="Tap to change status"
        className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${chip[status].className}`}
      >
        {chip[status].label}
      </button>
    </form>
  );
}
