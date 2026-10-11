"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { sendMagicLink, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, {});
  const params = useSearchParams();
  const linkFailed = params.get("error") === "link";

  if (params.get("sent") === "1") {
    return <p className="rounded-lg border border-line p-4">Check your inbox for the sign-in link.</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm text-muted">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="rounded-lg border border-line bg-transparent px-3 py-2"
      />
      <button
        disabled={pending}
        className="rounded-lg bg-foreground px-3 py-2 font-medium text-background disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send magic link"}
      </button>
      {(state.error || linkFailed) && (
        <p role="alert" className="text-sm text-red-500">
          {state.error ?? "That sign-in link is invalid or expired. Request a new one."}
        </p>
      )}
    </form>
  );
}
