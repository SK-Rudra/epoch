"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isAllowedEmail } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { sent?: boolean; error?: string };

const schema = z.object({ email: z.email() });

export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Enter a valid email address." };

  // The real gate: checked on the server, so editing the page can't bypass it.
  if (!isAllowedEmail(parsed.data.email)) return { error: "This email is not allowed to sign in." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: false, // the only account is created by the seed script
      emailRedirectTo: `${process.env.SITE_URL}/auth/callback`,
    },
  });
  if (error) return { error: `Could not send the link: ${error.message}` };
  return { sent: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
