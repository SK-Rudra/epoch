"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { buttonClass, inputClass } from "@/components/ui";
import { saveReview, type ReviewState } from "./actions";
import { MOODS, MoodMark } from "./mood";

export type Review = { week_start: string; wins: string; blockers: string; next_week_priorities: string[]; mood: number };

// Pre-filled with this week's review (if any), so saving again edits it.
export function ReviewForm({ week, review }: { week: string; review?: Review }) {
  // Same server action as before; the wrapper only adds the toast.
  const [state, action, pending] = useActionState<ReviewState, FormData>(async (prev, formData) => {
    const result = await saveReview(prev, formData);
    if (result.saved) toast.success(review ? "Review updated" : "Review saved");
    return result;
  }, {});

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="week_start" value={week} />
      <Field label="Wins">
        <textarea name="wins" rows={3} maxLength={2000} defaultValue={review?.wins ?? ""} className={inputClass} />
      </Field>
      <Field label="Blockers">
        <textarea name="blockers" rows={3} maxLength={2000} defaultValue={review?.blockers ?? ""} className={inputClass} />
      </Field>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm text-graphite">Top 3 priorities for next week</legend>
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-center">
            <span aria-hidden className="font-mono text-sm text-graphite">{i + 1}.</span>
            <input name="priority" maxLength={200} aria-label={`Priority ${i + 1}`}
              defaultValue={review?.next_week_priorities[i] ?? ""} className={inputClass} />
          </div>
        ))}
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm text-graphite">Mood</legend>
        {/* Segmented scale built from real radio buttons, so arrow keys and screen readers work as usual. */}
        <div className="grid grid-cols-5 overflow-hidden rounded-md border border-graphite/80">
          {MOODS.map((m, i) => (
            <label key={m}
              className="flex cursor-pointer flex-col items-center gap-1 border-l border-graphite/40 bg-raised py-2.5 text-ink transition-colors duration-150 first:border-l-0 hover:bg-ink/5 has-checked:bg-ink has-checked:text-paper has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-plot">
              <input type="radio" name="mood" value={i + 1} required defaultChecked={review?.mood === i + 1} className="sr-only" />
              {/* aria-hidden: the word below already names the mood */}
              <span aria-hidden><MoodMark mood={i + 1} tone="current" /></span>
              <span className="text-xs">{m}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex items-center gap-4">
        <button disabled={pending} className={buttonClass}>
          {pending ? "Saving…" : review ? "Update review" : "Save review"}
        </button>
        {state.error && <p role="alert" className="text-sm text-fault">{state.error}</p>}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-graphite">
      {label}
      {children}
    </label>
  );
}
