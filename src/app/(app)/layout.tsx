import { Suspense } from "react";
import { BottomTabs, BottomTabsView, TopBar, TopBarView } from "@/components/top-bar";
import { dhakaDate } from "@/lib/dates";
import { currentPhase, phaseProgress, type Status } from "@/lib/progress";
import { requireUser } from "@/lib/supabase/server";

// Layout for every signed-in page (the "(app)" folder name doesn't appear in URLs).
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* Same bar without numbers while the data loads, so nothing jumps when it arrives. */}
      <Suspense fallback={<TopBarView phases={null} today={undefined} pathname="" />}>
        <TopBarWithData />
      </Suspense>
      {/* Room for the phone tab bar, including the iPhone home-indicator area. */}
      <div className="flex flex-1 flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
      <Suspense fallback={<BottomTabsView pathname="" />}>
        <BottomTabs />
      </Suspense>
    </>
  );
}

type PhaseRow = {
  number: number;
  title: string;
  start_date: string;
  skills: { status: Status }[];
  courses: { status: Status }[];
  projects: { status: Status }[];
  goals: { done: boolean }[];
};

async function TopBarWithData() {
  const { supabase } = await requireUser();
  const today = dhakaDate();
  const [phasesRes, logRes] = await Promise.all([
    supabase
      .from("phases")
      .select("number, title, start_date, skills(status), courses(status), projects(status), goals(done)")
      .order("number")
      .returns<PhaseRow[]>(),
    // Today's row, for the "L" quick-log dialog.
    supabase
      .from("daily_logs")
      .select("study_hours, leetcode_solved, ielts_minutes, workout, note, updated_at")
      .eq("date", today)
      .maybeSingle(),
  ]);
  if (phasesRes.error) throw new Error(phasesRes.error.message);
  if (logRes.error) throw new Error(logRes.error.message);

  const current = currentPhase(phasesRes.data, today)?.number;
  return (
    <TopBar
      phases={phasesRes.data.map((p) => ({ number: p.number, title: p.title, progress: phaseProgress(p), current: p.number === current }))}
      today={logRes.data}
    />
  );
}
