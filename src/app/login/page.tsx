import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">Epoch</h1>
        <p className="text-muted">Train yourself. One epoch at a time.</p>
      </div>
      <LoginForm />
    </main>
  );
}
