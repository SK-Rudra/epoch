"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

const input = "rounded-lg border border-line bg-transparent px-3 py-2";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm text-muted">
        Email
      </label>
      <input id="email" name="email" type="email" required autoComplete="email" className={input} />
      <label htmlFor="password" className="text-sm text-muted">
        Password
      </label>
      <input id="password" name="password" type="password" required autoComplete="current-password" className={input} />
      <button
        disabled={pending}
        className="rounded-lg bg-foreground px-3 py-2 font-medium text-background disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-red-500">
          {state.error}
        </p>
      )}
    </form>
  );
}
