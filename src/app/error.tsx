"use client";

import { startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RotateCw } from "lucide-react";
import { buttonClass } from "@/components/ui";

// Shown when a page (or the top bar) fails to load, e.g. Supabase is unreachable.
// Also used by (app)/error.tsx, so page errors keep the top bar around them.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-10 md:px-8">
      <p className="font-mono text-xs text-graphite">error{error.digest ? ` · ${error.digest}` : ""}</p>
      <h1 className="text-2xl">This page didn&apos;t load</h1>
      <p className="max-w-prose text-graphite">
        Usually that means the connection to the database dropped. Your saved data is safe. Try again, and if it keeps
        happening, check your internet connection.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <button
          type="button"
          className={buttonClass}
          // refresh() re-fetches the server data; reset() re-renders the page that failed.
          onClick={() => startTransition(() => { router.refresh(); reset(); })}
        >
          <RotateCw size={16} strokeWidth={1.75} aria-hidden />
          Try again
        </button>
        <Link href="/" className="text-sm underline decoration-graphite/60 underline-offset-4 hover:decoration-ink">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
