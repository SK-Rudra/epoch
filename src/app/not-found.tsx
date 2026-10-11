import Link from "next/link";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-10 md:px-8">
      <p className="font-mono text-xs text-graphite">404 · no checkpoint at this address</p>
      <h1 className="text-2xl">Page not found</h1>
      <p className="max-w-prose text-graphite">
        This link doesn&apos;t point anywhere in Epoch. Phases go from 1 to 6, e.g. /phases/3.
      </p>
      <Link href="/" className="mt-2 text-sm underline decoration-graphite/60 underline-offset-4 hover:decoration-ink">
        Go to dashboard
      </Link>
    </main>
  );
}
