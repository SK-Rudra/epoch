import { Suspense } from "react";
import Link from "next/link";
import { z } from "zod";
import { addDays, dhakaDate, weekStart } from "@/lib/dates";
import { requireUser } from "@/lib/supabase/server";
import { ReviewForm, type Review } from "./review-form";

export const metadata = { title: "Weekly review" };

export default function ReviewsPage({ searchParams }: PageProps<"/reviews">) {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
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
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-2xl font-bold">Weekly review</h1>
          <nav className="flex gap-3 text-sm text-muted">
            <Link href={`/reviews?week=${addDays(week, -7)}`}>← Prev</Link>
            {week < thisWeek && <Link href={`/reviews?week=${addDays(week, 7)}`}>Next →</Link>}
          </nav>
        </div>
        <p className="text-sm text-muted">
          Week of {weekLabel(week)}{week === thisWeek && " (this week)"}
        </p>
        {/* key resets the form's default values when you switch weeks */}
        <ReviewForm key={week} week={week} review={current} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">History</h2>
        {reviews.length === 0 && <p className="text-sm text-muted">No reviews yet.</p>}
        {reviews.map((r) => (
          <article key={r.week_start} className="flex flex-col gap-2 rounded-lg border border-line p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-semibold">{weekLabel(r.week_start)}</h3>
              <span className="text-sm text-muted">
                Mood {r.mood}/5 · <Link href={`/reviews?week=${r.week_start}`} className="underline">Edit</Link>
              </span>
            </div>
            {r.wins && <Text label="Wins" text={r.wins} />}
            {r.blockers && <Text label="Blockers" text={r.blockers} />}
            {r.next_week_priorities.length > 0 && (
              <div className="text-sm">
                <p className="text-muted">Priorities</p>
                <ol className="list-inside list-decimal">
                  {r.next_week_priorities.map((p, i) => <li key={i}>{p}</li>)}
                </ol>
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}

function Text({ label, text }: { label: string; text: string }) {
  return (
    <div className="text-sm">
      <p className="text-muted">{label}</p>
      <p className="whitespace-pre-line">{text}</p>
    </div>
  );
}
