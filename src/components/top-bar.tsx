"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Activity, CalendarClock, Check, LayoutDashboard, NotebookPen, X } from "lucide-react";
import { QuickLogForm, type Log } from "@/app/(app)/quick-log-form";
import { PHASE_SHORT } from "@/lib/run";
import { ThemeToggle } from "./theme";

export type PhaseTab = { number: number; title: string; progress: number; current: boolean };
/** Today's log row for the "L" dialog: undefined = still loading, null = nothing logged yet today. */
export type TodayLog = (Log & { updated_at: string }) | null | undefined;


const NAV = [
  { href: "/", label: "Dashboard", short: "Dashboard", Icon: LayoutDashboard },
  { href: "/activity", label: "Activity", short: "Activity", Icon: Activity },
  { href: "/reviews", label: "Weekly review", short: "Review", Icon: NotebookPen },
  { href: "/schedule", label: "Schedule", short: "Schedule", Icon: CalendarClock },
] as const;

const isCurrent = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

// Reading the URL (usePathname) must happen inside <Suspense> on dynamic routes, so each bar is a
// plain view that takes pathname as a prop; the loading fallback renders the view with pathname="".
export function TopBar({ phases, today }: { phases: PhaseTab[] | null; today: TodayLog }) {
  return <TopBarView phases={phases} today={today} pathname={usePathname()} />;
}

/** phases is null while the data is still loading: same layout, no numbers. */
export function TopBarView({ phases, today, pathname }: { phases: PhaseTab[] | null; today: TodayLog; pathname: string }) {
  const open = Number(pathname.match(/^\/phases\/(\d)/)?.[1] ?? 0); // phase page being viewed, 0 = none

  return (
    <header className="sticky top-0 z-30 border-b border-grid bg-paper">
      {/* Phones/tablets: wordmark + nav on row 1, phases on row 2. Wide screens: one row. */}
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center xl:flex-nowrap">
        <Link href="/" className="font-wide flex h-12 items-center px-4 text-lg transition-transform active:scale-[0.97]">
          Epoch
        </Link>
        <PhaseStrip phases={phases} open={open} />
        <nav aria-label="Main" className="ml-auto hidden items-center md:flex">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isCurrent(pathname, href) ? "page" : undefined}
              className="group relative flex h-12 items-center px-3 text-sm text-graphite transition-colors duration-150 hover:text-ink active:scale-[0.97] aria-[current=page]:text-ink"
            >
              {label}
              <span aria-hidden className="absolute inset-x-3 bottom-0 h-0.5 bg-plot opacity-0 group-aria-[current=page]:opacity-100" />
            </Link>
          ))}
        </nav>
        <ThemeToggle className="ml-auto mr-1 md:ml-0" />
      </div>
      <Shortcuts today={today} />
    </header>
  );
}

function PhaseStrip({ phases, open }: { phases: PhaseTab[] | null; open: number }) {
  const list = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const focus = open || phases?.find((p) => p.current)?.number || 0;

  // When the strip is scrollable (phones), bring the open phase (or the current one) into the middle.
  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>(`[data-phase="${focus}"]`);
    const ol = list.current;
    if (!el || !ol || ol.scrollWidth <= ol.clientWidth) return;
    ol.scrollTo({ left: el.offsetLeft - (ol.clientWidth - el.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
  }, [focus, reduce]);

  return (
    <nav aria-label="Epochs" className="order-last w-full min-w-0 border-t border-grid xl:order-none xl:w-auto xl:flex-1 xl:border-t-0">
      <ol
        ref={list}
        className="relative flex snap-x snap-proximity overflow-x-auto px-2 [scrollbar-width:none] xl:justify-center"
      >
        {/* Short names so all six fit; the full title is in the tooltip and screen-reader text. */}
        {PHASE_SHORT.map((name, i) => {
          const n = i + 1;
          const p = phases?.[i];
          const done = p?.progress === 100;
          return (
            <li key={n} data-phase={n} className="shrink-0 snap-center">
              <Link
                href={`/phases/${n}`}
                title={p?.title}
                aria-current={open === n ? "page" : undefined}
                className="relative isolate flex h-11 items-center gap-1.5 px-3 text-sm whitespace-nowrap text-graphite transition-[color,transform] duration-150 hover:text-ink focus-visible:outline-offset-[-2px] active:scale-[0.97] aria-[current=page]:text-ink"
              >
                {/* One highlight shared by all segments: motion slides it to whichever is open. */}
                {open === n && (
                  <motion.span
                    layoutId="phase-highlight"
                    className="absolute inset-x-0.5 inset-y-1.5 -z-10 rounded-md bg-ink/[0.07]"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="font-mono text-xs">E{n}</span>
                {name}
                {p?.current && <LiveDot />}
                {done && <Check size={14} strokeWidth={1.75} className="text-plot" aria-hidden />}
                <span className="sr-only">
                  {p ? `, ${p.progress}% complete${p.current ? ", current epoch" : ""}${done ? ", checkpoint reached" : ""}` : ""}
                </span>
                {/* Thin % underline: grid track, plot fill that grows from 0 on first view. */}
                <span aria-hidden className="absolute inset-x-3 bottom-1 h-0.5 overflow-hidden rounded-full bg-grid">
                  {p && (
                    <motion.span
                      className="block h-full origin-left bg-plot"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: p.progress / 100 }}
                      transition={{ duration: 0.4, delay: 0.05 * i }}
                    />
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Pulsing "live" dot for the epoch you're in today. The ping is turned off by the reduced-motion CSS rule.
function LiveDot() {
  return (
    <span aria-hidden className="relative flex size-1.5">
      <span className="absolute inset-0 animate-ping rounded-full bg-plot opacity-60 [animation-duration:2s]" />
      <span className="relative size-1.5 rounded-full bg-plot" />
    </span>
  );
}

export function BottomTabs() {
  return <BottomTabsView pathname={usePathname()} />;
}

/** Phone-only tab bar for the main pages; sits above the iPhone home indicator. */
export function BottomTabsView({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-grid bg-paper pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-4">
        {NAV.map(({ href, short, Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isCurrent(pathname, href) ? "page" : undefined}
              className="flex h-14 flex-col items-center justify-center gap-0.5 text-xs text-graphite transition-[color,transform] duration-150 focus-visible:outline-offset-[-2px] active:scale-95 aria-[current=page]:text-plot"
            >
              <Icon size={20} strokeWidth={1.75} aria-hidden />
              {short}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const SHORTCUTS = [
  ["1 – 6", "Open epoch 1–6"],
  ["L", "Log today"],
  ["?", "Show this list"],
];

/** Keys 1–6 open that phase, L opens today's log, ? lists the shortcuts. Ignored while typing in a field. */
function Shortcuts({ today }: { today: TodayLog }) {
  const router = useRouter();
  const help = useRef<HTMLDialogElement>(null);
  const log = useRef<HTMLDialogElement>(null);
  const loaded = today !== undefined; // never offer the form before today's row is known: saving blanks would wipe it

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (e.ctrlKey || e.metaKey || e.altKey || t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (document.querySelector("dialog[open]")) return; // one dialog at a time
      if (/^[1-6]$/.test(e.key)) router.push(`/phases/${e.key}`);
      else if (e.key === "?") help.current?.showModal();
      else if (e.key.toLowerCase() === "l" && loaded) {
        e.preventDefault(); // don't type "l" into the field that gets focus
        log.current?.showModal();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, loaded]);

  return (
    <>
      <Dialog ref={help} title="Keyboard shortcuts">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {SHORTCUTS.map(([key, what]) => (
            <div key={key} className="contents">
              <dt><kbd className="rounded border border-graphite/80 px-1.5 py-0.5 font-mono text-xs">{key}</kbd></dt>
              <dd className="text-graphite">{what}</dd>
            </div>
          ))}
        </dl>
      </Dialog>
      <Dialog ref={log} title="Log today" wide>
        {/* key: re-fill the form whenever today's saved row changes */}
        {loaded && <QuickLogForm key={today?.updated_at ?? "new"} today={today} onSaved={() => log.current?.close()} />}
      </Dialog>
    </>
  );
}

// Native <dialog>: Esc closes it and keyboard focus stays inside for free. starting: = fade in when it opens.
function Dialog({ ref, title, wide, children }: {
  ref: React.Ref<HTMLDialogElement>;
  title: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const id = `dialog-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className={`m-auto ${wide ? "w-[min(36rem,calc(100%-2rem))]" : "w-[min(22rem,calc(100%-2rem))]"} rounded-lg border border-grid bg-paper p-5 text-ink opacity-100 transition-[opacity,transform] duration-150 backdrop:bg-ink/30 starting:open:scale-[0.98] starting:open:opacity-0`}
      onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()} // click outside closes
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 id={id} className="text-lg">{title}</h2>
        <button
          type="button"
          onClick={(e) => e.currentTarget.closest("dialog")?.close()}
          aria-label="Close"
          className="grid size-9 place-items-center text-graphite transition-[color,transform] hover:text-ink active:scale-95"
        >
          <X size={18} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
      {children}
    </dialog>
  );
}
