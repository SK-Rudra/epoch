"use client";

import { useActionState } from "react";
import { saveReview, type ReviewState } from "./actions";

export type Review = { week_start: string; wins: string; blockers: string; next_week_priorities: string[]; mood: number };

const input = "w-full rounded-lg border border-line bg-transparent px-3 py-2";
const moods = ["Rough", "Meh", "Okay", "Good", "Great"];

// Pre-filled with this week's review (if any), so saving again edits it.
export function ReviewForm({ week, review }: { week: string; review?: Review }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(saveReview, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="week_start" value={week} />
      <Field label="Wins">
        <textarea name="wins" rows={3} maxLength={2000} defaultValue={review?.wins ?? ""} className={input} />
      </Field>
      <Field label="Blockers">
        <textarea name="blockers" rows={3} maxLength={2000} defaultValue={review?.blockers ?? ""} className={input} />
      </Field>
      <fieldset className="flex flex-col gap-2 text-sm text-muted">
        <legend className="mb-1">Top 3 priorities for next week</legend>
        {[0, 1, 2].map((i) => (
          <input key={i} name="priority" maxLength={200} aria-label={`Priority ${i + 1}`} placeholder={`${i + 1}.`}
            defaultValue={review?.next_week_priorities[i] ?? ""} className={`${input} text-foreground`} />
        ))}
      </fieldset>
      <fieldset className="flex flex-col gap-2 text-sm text-muted">
        <legend className="mb-1">Mood</legend>
        <div className="grid grid-cols-5 gap-2">
          {moods.map((m, i) => (
            <label key={m}
              className="flex flex-col items-center rounded-lg border border-line py-2 text-foreground has-checked:bg-foreground has-checked:text-background has-focus-visible:ring-2 has-focus-visible:ring-emerald-500">
              <input type="radio" name="mood" value={i + 1} required defaultChecked={review?.mood === i + 1} className="sr-only" />
              <span className="font-semibold">{i + 1}</span>
              <span className="text-xs">{m}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button disabled={pending}
        className="rounded-lg bg-foreground px-3 py-2 font-medium text-background disabled:opacity-60">
        {pending ? "Saving…" : review ? "Update review" : "Save review"}
      </button>
      <p role="status" className={`text-sm ${state.error ? "text-red-500" : "text-muted"}`}>
        {state.error ?? (state.saved ? "Saved." : "")}
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-muted">
      {label}
      {children}
    </label>
  );
}
