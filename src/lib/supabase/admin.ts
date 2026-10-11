import "server-only"; // the build fails if a Client Component ever imports this file
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isAllowedEmail } from "@/lib/auth";

// SERVICE ROLE: this client skips RLS. Only the LeetCode cron uses it, because the cron runs
// with no signed-in user. Everything else goes through the user's session in ./server.ts.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** The id of the ALLOWED_EMAIL account, so rows written without a session still belong to it. */
export async function allowedUserId(admin: SupabaseClient): Promise<string> {
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw new Error(error.message);
  const user = data.users.find((u) => isAllowedEmail(u.email));
  if (!user) throw new Error("No account for ALLOWED_EMAIL");
  return user.id;
}
