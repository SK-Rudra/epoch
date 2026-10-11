"use client";

import { useSyncExternalStore } from "react";
import { ThemeProvider as NextThemes, useTheme } from "next-themes";
import { MotionConfig } from "motion/react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Toaster } from "sonner";

// next-themes runs a tiny script before first paint, so the page never flashes the wrong theme.
// MotionConfig reducedMotion="user": with "reduce motion" on, movement animations are skipped (fades stay).
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemes attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}>
        {children}
        <ThemedToaster />
      </MotionConfig>
    </NextThemes>
  );
}

// Save confirmations. Coloured with our tokens; on phones it sits above the bottom tab bar.
function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      mobileOffset={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
      style={{ "--normal-bg": "var(--paper)", "--normal-text": "var(--ink)", "--normal-border": "var(--graphite)" } as React.CSSProperties}
      toastOptions={{ className: "font-sans" }}
    />
  );
}

const order = ["system", "light", "dark"] as const;
const icons = { system: Monitor, light: Sun, dark: Moon };

// false during server render + hydration, true after: the saved theme is only known in the browser.
const useIsClient = () => useSyncExternalStore(() => () => {}, () => true, () => false);

/** One button that cycles system → light → dark. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme = "system", setTheme } = useTheme();
  const isClient = useIsClient();
  const current = isClient && theme in icons ? (theme as keyof typeof icons) : "system";
  const next = order[(order.indexOf(current) + 1) % order.length];
  const Icon = icons[current];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${current}. Switch to ${next}.`}
      title={`Theme: ${current}`}
      className={`grid size-11 place-items-center text-graphite transition-colors duration-150 hover:text-ink active:scale-95 ${className}`}
    >
      <Icon size={18} strokeWidth={1.75} aria-hidden />
    </button>
  );
}
