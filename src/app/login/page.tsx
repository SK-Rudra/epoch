import type { Metadata } from "next";
import { RunTimeline } from "@/components/run-viz";
import { ThemeToggle } from "@/components/theme";
import { timeline } from "@/lib/run";
import { phases } from "../../../data/roadmap-seed.json";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

// Phase data needs a signed-in user, so the login page draws its faint timeline from the seed file's dates.
// Decoration only: no titles, progress or "today" reach this public page, and it stays fully static.
const segments = timeline(phases, phases[0].start_date).segments.map(({ phase, offset, width }) => ({
  number: phase.number,
  title: "",
  offset,
  width,
  progress: 0,
}));

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 md:px-8">
        <span className="font-wide flex h-12 items-center text-lg">Epoch</span>
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-14 px-4 py-10 md:px-8">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl">Sign in</h1>
            <p className="text-graphite">Train yourself. One epoch at a time.</p>
          </div>
          <LoginForm />
        </div>
        <RunTimeline segments={segments} today={null} current={null} />
      </main>
    </div>
  );
}
