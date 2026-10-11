"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { syncLeetcodeNow } from "./actions";

/** Pulls fresh LeetCode numbers now. The server allows one LeetCode request per 10 minutes. */
export function SyncButton() {
  const [pending, start] = useTransition();
  const sync = () =>
    start(async () => {
      const { error } = await syncLeetcodeNow();
      if (error) toast.error(error);
      else toast.success("LeetCode synced");
    });

  return (
    <button
      type="button"
      onClick={sync}
      disabled={pending}
      className="inline-flex h-11 shrink-0 items-center gap-1.5 px-2 text-graphite transition-[color,transform] hover:text-ink active:scale-[0.97] disabled:opacity-60"
    >
      <RefreshCw size={14} strokeWidth={1.75} aria-hidden className={pending ? "animate-spin" : undefined} />
      {pending ? "Syncing…" : "Sync now"}
    </button>
  );
}
