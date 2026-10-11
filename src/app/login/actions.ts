"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isAllowedEmail } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

const schema = z.object({ email: z.email(), password: z.string().min(1).max(200) });

// Same message for every failure, so the page never reveals which part was wrong.
const WRONG = { error: "Wrong email or password." };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return WRONG;

  // The real gate: checked on the server, so editing the page can't bypass it.
  if (!isAllowedEmail(parsed.data.email)) return WRONG;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return error.status === 429 ? { error: "Too many tries. Wait a few minutes." } : WRONG;
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
