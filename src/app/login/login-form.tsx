"use client";

import { useActionState } from "react";
import { buttonClass, inputClass } from "@/components/ui";
import { signIn, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm text-graphite">
        Email
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm text-graphite">
        Password
        <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
      </label>
      <button disabled={pending} className={`${buttonClass} mt-2 w-full`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {state.error && (
        <p role="alert" className="text-sm text-fault">
          {state.error}
        </p>
      )}
    </form>
  );
}
