import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { z } from "zod";
import { SectionHead } from "@/components/section-head";
import { addDays, dhakaDate, weekStart } from "@/lib/dates";
import { requireUser } from "@/lib/supabase/server";
import { MoodMark, MOODS } from "./mood";
import { ReviewForm, type Review } from "./review-form";

export const metadata = { title: "Weekly review" };

export default function ReviewsPage({ searchParams }: PageProps<"/reviews">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-8 md:py-10">
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

const weekLabel = (week: string) => `${shortDate(week)} – ${shortDate(addDays(week, 6))}`;
const shortDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" });

async function Reviews({ searchParams }: Pick<PageProps<"/reviews">, "searchParams">) {
  const { supabase } = await requireUser();
  const thisWeek = weekStart(dhakaDate());
  // ?week=YYYY-MM-DD picks which week the form edits; anything odd falls back to this week.
  const asked = z.iso.date().safeParse((await searchParams).week);
  const week = asked.success && weekStart(asked.data) < thisWeek ? weekStart(asked.data) : thisWeek;

  const { data: reviews, error } = await supabase
    .from("weekly_reviews")
    .select("week_start, wins, blockers, next_week_priorities, mood")
    .order("week_start", { ascending: false })
    .returns<Review[]>();
  if (error) throw new Error(error.message);

  const current = reviews.find((r) => r.week_start === week);

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-xs text-graphite">
            week of {weekLabel(week)}
            {week === thisWeek ? " · this week" : current ? " · editing" : " · not reviewed yet"}
          </p>
          <nav aria-label="Weeks" className="flex">
            <WeekLink href={`/reviews?week=${addDays(week, -7)}`} label="Previous week"><ChevronLeft size={18} strokeWidth={1.75} /></WeekLink>
            <WeekLink href={week < thisWeek ? `/reviews?week=${addDays(week, 7)}` : null} label="Next week"><ChevronRight size={18} strokeWidth={1.75} /></WeekLink>
          </nav>
        </div>
        <h1 className="text-2xl md:text-3xl">Weekly review</h1>
      </header>

      {/* key resets the form's default values when you switch weeks */}
      <ReviewForm key={week} week={week} review={current} />

      <section className="flex flex-col">
        <SectionHead title="History" note={`${reviews.length} ${reviews.length === 1 ? "week" : "weeks"}`} />
        {reviews.length === 0 && (
          <p className="py-4 text-sm text-graphite">No reviews yet. Your first one shows up here once you save the form above.</p>
        )}
        {reviews.map((r) => (
          <article
            key={r.week_start}
            aria-current={r.week_start === week ? "true" : undefined}
            className="flex flex-col gap-3 border-b border-grid py-5 aria-[current=true]:border-l-2 aria-[current=true]:border-l-plot aria-[current=true]:pl-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-mono text-sm">{weekLabel(r.week_start)}</h3>
              <div className="flex items-center gap-3 text-sm text-graphite">
                <span className="inline-flex items-center gap-2">
                  <MoodMark mood={r.mood} />
                  <span aria-hidden>{MOODS[r.mood - 1]}</span>
                </span>
                {r.week_start !== week && (
                  <Link
                    href={`/reviews?week=${r.week_start}`}
                    aria-label={`Edit review for ${weekLabel(r.week_start)}`}
                    className="inline-flex h-9 items-center gap-1 px-1 transition-[color,transform] hover:text-ink active:scale-[0.97]"
                  >
                    <Pencil size={14} strokeWidth={1.75} aria-hidden /> Edit
                  </Link>
                )}
              </div>
            </div>
            {/* Notebook layout: label column on the left from small tablets up, stacked on phones. */}
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[6.5rem_minmax(0,1fr)]">
              {r.wins && <Entry label="Wins"><p className="whitespace-pre-line">{r.wins}</p></Entry>}
              {r.blockers && <Entry label="Blockers"><p className="whitespace-pre-line">{r.blockers}</p></Entry>}
              {r.next_week_priorities.length > 0 && (
                <Entry label="Priorities">
                  <ol className="flex flex-col gap-0.5">
                    {r.next_week_priorities.map((p, i) => (
                      <li key={i}><span className="mr-2 font-mono text-graphite">{i + 1}.</span>{p}</li>
                    ))}
                  </ol>
                </Entry>
              )}
            </dl>
          </article>
        ))}
      </section>
    </div>
  );
}

function Entry({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="contents">
      <dt className="text-graphite">{label}</dt>
      <dd className="mb-2 sm:mb-0">{children}</dd>
    </div>
  );
}

// href null = no next week yet: shown greyed out, not clickable.
function WeekLink({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  const cls = "grid size-11 place-items-center";
  if (!href) return <span aria-disabled="true" aria-label={label} className={`${cls} text-graphite/40`}>{children}</span>;
  return (
    <Link href={href} aria-label={label} className={`${cls} text-graphite transition-[color,transform] hover:text-ink active:scale-95`}>
      {children}
    </Link>
  );
}

// Same shapes as the real page so nothing jumps when it loads.
function ReviewsSkeleton() {
  const block = "animate-pulse rounded bg-grid/70";
  return (
    <div className="flex flex-col gap-12" aria-busy="true" aria-label="Loading weekly review">
      <div className="flex flex-col gap-2">
        <div className={`${block} h-4 w-64`} />
        <div className={`${block} h-9 w-60`} />
      </div>
      <div className="flex flex-col gap-5">
        <div className={`${block} h-24`} />
        <div className={`${block} h-24`} />
        <div className={`${block} h-32`} />
        <div className={`${block} h-16`} />
      </div>
    </div>
  );
}
