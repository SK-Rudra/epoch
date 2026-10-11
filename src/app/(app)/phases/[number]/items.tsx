"use client";

import { useOptimistic, useRef, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { nextStatus, type Status } from "@/lib/progress";
import { cycleStatus, toggleGoal } from "./actions";

/**
 * Runs server-action calls one after another, so fast repeated taps can't land out of order
 * (e.g. "done" saved before "in progress" and then overwritten by it).
 */
function useQueue() {
  const queue = useRef(Promise.resolve());
  return (run: () => Promise<void>) => (queue.current = queue.current.then(run, run));
}

const chip: Record<Status, { label: string; className: string }> = {
  not_started: { label: "Not started", className: "border-dashed border-graphite/80 text-graphite" },
  in_progress: { label: "In progress", className: "border-plot/70 bg-plot/10 text-plot" },
  done: { label: "Done", className: "border-ink bg-ink text-paper" },
};

/** Status by shape as well as colour: dashed ring → half-filled ring → solid disc with a tick. */
function StatusIcon({ status }: { status: Status }) {
  return (
    <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
      {status === "not_started" && <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.6" />}
      {status === "in_progress" && (
        <>
          <circle cx="6" cy="6" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 1.5a4.5 4.5 0 0 0 0 9z" fill="currentColor" />
        </>
      )}
      {status === "done" && (
        <>
          <circle cx="6" cy="6" r="5.25" fill="currentColor" />
          <path d="M3.6 6.2l1.6 1.6 3.2-3.4" fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

/** Tap to move to the next status. Changes on screen straight away; the save happens in the background. */
export function StatusChip({ table, id, status }: { table: "skills" | "courses" | "projects"; id: string; status: Status }) {
  const [shown, setShown] = useOptimistic(status);
  const [, startTransition] = useTransition();
  const enqueue = useQueue();

  function onClick() {
    const from = shown;
    startTransition(async () => {
      setShown(nextStatus(from));
      // Same form fields the old <form> sent, so the server action is unchanged.
      const form = new FormData();
      form.set("table", table);
      form.set("id", id);
      form.set("status", from);
      await enqueue(() => cycleStatus(form)).catch(() => {
        toast.error("Couldn't update the status. Check your connection and try again.");
      });
    });
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      title="Tap to change status"
      aria-label={`Status: ${chip[shown].label}. Tap to change.`}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      // Fixed width fits the longest label, so the row never reflows when the status changes.
      className={`inline-flex h-7 min-w-[7.25rem] items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap transition-colors duration-200 ${chip[shown].className}`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={shown}
          className="inline-flex items-center gap-1.5"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <StatusIcon status={shown} />
          {chip[shown].label}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

type Goal = { id: string; text: string; done: boolean };

/** Checklist: ticks instantly, done goals slide to the bottom, the strike-through fades in. */
export function GoalList({ goals }: { goals: Goal[] }) {
  const [shown, toggle] = useOptimistic(goals, (list, id: string) =>
    list.map((g) => (g.id === id ? { ...g, done: !g.done } : g)),
  );
  const [, startTransition] = useTransition();
  const enqueue = useQueue();

  function onToggle(goal: Goal) {
    startTransition(async () => {
      toggle(goal.id);
      const form = new FormData();
      form.set("id", goal.id);
      form.set("done", String(goal.done));
      await enqueue(() => toggleGoal(form)).catch(() => {
        toast.error("Couldn't save that goal. Check your connection and try again.");
      });
    });
  }

  // Open goals first, done ones after; each group keeps its original order.
  const ordered = [...shown.filter((g) => !g.done), ...shown.filter((g) => g.done)];

  return (
    <ul className="flex flex-col">
      {ordered.map((g) => (
        <motion.li key={g.id} layout="position" transition={{ type: "spring", stiffness: 400, damping: 36 }} className="border-b border-grid">
          <button
            type="button"
            role="checkbox"
            aria-checked={g.done}
            onClick={() => onToggle(g)}
            className="group flex min-h-11 w-full items-start gap-3 py-3 text-left focus-visible:outline-offset-[-2px]"
          >
            <span
              aria-hidden
              className={`mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[4px] border transition-colors duration-200 ${
                g.done ? "border-plot bg-plot text-paper" : "border-graphite/80 group-hover:border-ink"
              }`}
            >
              <AnimatePresence initial={false}>
                {g.done && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 600, damping: 28 }}>
                    <Check size={13} strokeWidth={2.5} />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            {/* line-through is always there; only its colour fades in, so it works across wrapped lines. */}
            <span
              className={`line-through transition-[color,text-decoration-color] duration-300 ${
                g.done ? "text-graphite decoration-graphite" : "decoration-transparent"
              }`}
            >
              {g.text}
            </span>
          </button>
        </motion.li>
      ))}
    </ul>
  );
}
