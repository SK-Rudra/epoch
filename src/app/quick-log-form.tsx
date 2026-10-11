"use client";

import { useActionState } from "react";
import { saveTodayLog, type LogState } from "./actions";

type Log = { study_hours: number | string; leetcode_solved: number; ielts_minutes: number; workout: boolean; note: string };

const input = "w-full rounded-lg border border-line bg-transparent px-3 py-2";

// Pre-filled with today's row (if any), so saving again edits it.
export function QuickLogForm({ today }: { today?: Log }) {
  const [state, action, pending] = useActionState<LogState, FormData>(saveTodayLog, {});

  return (
    <form action={action} className="grid grid-cols-2 gap-3">
      <Field label="Study hours">
        <input name="study_hours" type="number" inputMode="decimal" min={0} max={24} step={0.25}
          defaultValue={Number(today?.study_hours ?? 0)} className={input} />
      </Field>
      <Field label="LeetCode solved">
        <input name="leetcode_solved" type="number" inputMode="numeric" min={0} max={100}
          defaultValue={today?.leetcode_solved ?? 0} className={input} />
      </Field>
      <Field label="IELTS minutes">
        <input name="ielts_minutes" type="number" inputMode="numeric" min={0} max={1440}
          defaultValue={today?.ielts_minutes ?? 0} className={input} />
      </Field>
      <label className="flex items-center gap-2 self-end py-2">
        <input name="workout" type="checkbox" defaultChecked={today?.workout ?? false} className="size-5" />
        Workout
      </label>
      <Field label="Note" className="col-span-2">
        <textarea name="note" rows={2} maxLength={500} defaultValue={today?.note ?? ""} className={input} />
      </Field>
      <button disabled={pending}
        className="col-span-2 rounded-lg bg-foreground px-3 py-2 font-medium text-background disabled:opacity-60">
        {pending ? "Saving…" : "Save today"}
      </button>
      <p role="status" className={`col-span-2 text-sm ${state.error ? "text-red-500" : "text-muted"}`}>
        {state.error ?? (state.saved ? "Saved." : "")}
      </p>
    </form>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1 text-sm text-muted ${className}`}>
      {label}
      {children}
    </label>
  );
}
