"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { buttonClass, inputClass } from "@/components/ui";
import { saveTodayLog, type LogState } from "./actions";

export type Log = { study_hours: number | string; leetcode_solved: number; ielts_minutes: number; workout: boolean; note: string };

const numberInput = `${inputClass} font-mono`;

// Pre-filled with today's row (if any), so saving again edits it.
// onSaved lets the "L" dialog close itself after a successful save.
export function QuickLogForm({ today, onSaved }: { today?: Log | null; onSaved?: () => void }) {
  // Same server action as before; the wrapper only adds the toast.
  const [state, action, pending] = useActionState<LogState, FormData>(async (prev, formData) => {
    const result = await saveTodayLog(prev, formData);
    if (result.saved) {
      toast.success("Saved today's log");
      onSaved?.();
    }
    return result;
  }, {});

  return (
    <form action={action} className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4">
      <Field label="Study hours">
        <input name="study_hours" type="number" inputMode="decimal" min={0} max={24} step={0.25}
          defaultValue={Number(today?.study_hours ?? 0)} className={numberInput} />
      </Field>
      <Field label="LeetCode solved">
        <input name="leetcode_solved" type="number" inputMode="numeric" min={0} max={1000}
          defaultValue={today?.leetcode_solved ?? 0} className={numberInput} />
        <input type="hidden" name="leetcode_loaded" value={today?.leetcode_solved ?? 0} />
      </Field>
      <Field label="IELTS minutes">
        <input name="ielts_minutes" type="number" inputMode="numeric" min={0} max={1440}
          defaultValue={today?.ielts_minutes ?? 0} className={numberInput} />
      </Field>
      {/* Same height and border as the inputs, so the row lines up. */}
      <label className="flex h-[42px] cursor-pointer items-center gap-2 self-end rounded-md border border-graphite/80 bg-raised px-3 text-ink transition-colors duration-150 hover:border-ink">
        <input name="workout" type="checkbox" defaultChecked={today?.workout ?? false} className="size-4 accent-plot" />
        Workout
      </label>
      <Field label="Note" className="col-span-2 sm:col-span-4">
        <textarea name="note" rows={2} maxLength={500} defaultValue={today?.note ?? ""} className={inputClass} />
      </Field>
      <div className="col-span-2 flex items-center gap-4 sm:col-span-4">
        <button disabled={pending} className={buttonClass}>
          {pending ? "Saving…" : "Save today"}
        </button>
        {state.error && <p role="alert" className="text-sm text-fault">{state.error}</p>}
      </div>
    </form>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm text-graphite ${className}`}>
      {label}
      {children}
    </label>
  );
}
