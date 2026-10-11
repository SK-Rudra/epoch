import { timeAgo } from "@/lib/dates";

// The cron runs once a day (±59 min), so anything older than this means a sync failed.
const STALE_MS = 26 * 3_600_000;
const isStale = (iso: string) => Date.now() - Date.parse(iso) > STALE_MS;

/**
 * Small warning when the LeetCode numbers on screen may be old: the last sync failed (LeetCode down,
 * response changed shape) or the snapshot couldn't be read. The page still shows the last saved numbers.
 */
export function LeetcodeWarning({ syncedAt, unreadable = false }: { syncedAt: string | null | undefined; unreadable?: boolean }) {
  const text = unreadable
    ? "Couldn't load saved LeetCode data."
    : syncedAt && isStale(syncedAt)
      ? `LeetCode last synced ${timeAgo(syncedAt)}. Showing the last saved numbers.`
      : null;
  return text && <p role="status" className="text-xs text-fault">⚠ {text}</p>;
}
