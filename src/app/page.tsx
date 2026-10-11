import { Suspense } from "react";
import { requireUser } from "@/lib/supabase/server";
import { signOut } from "./login/actions";

// Placeholder until the dashboard step.
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <SignedIn />
      </Suspense>
    </main>
  );
}

async function SignedIn() {
  const { user } = await requireUser();
  return (
    <div className="flex flex-col gap-4">
      <p>
        Signed in as <strong>{user.email}</strong>
      </p>
      <form action={signOut}>
        <button className="rounded-lg border border-line px-3 py-2">Sign out</button>
      </form>
    </div>
  );
}
