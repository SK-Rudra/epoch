// Sets the sign-in password for ALLOWED_EMAIL's account (run `npm run seed` first to create it).
// The password is typed in, never stored in a file. Uses the service role key: never import from the app.
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const env = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    ALLOWED_EMAIL: z.email(),
  })
  .parse(process.env);

// Reads one line from the terminal without showing what is typed.
function askHidden(question: string): Promise<string> {
  if (!process.stdin.isTTY) throw new Error("Run this in a real terminal so the password can be typed in.");
  process.stdout.write(question);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  let answer = "";
  return new Promise((resolve) => {
    const onData = (key: string) => {
      for (const ch of key) {
        if (ch === "\r" || ch === "\n") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.off("data", onData);
          process.stdout.write("\n");
          return resolve(answer);
        }
        if (ch === "\u0003") process.exit(130); // Ctrl+C
        if (ch === "\u007f" || ch === "\b") answer = answer.slice(0, -1);
        else answer += ch;
      }
    };
    process.stdin.on("data", onData);
  });
}

async function main() {
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // ponytail: first page only (50 users), same as the seed script.
  const list = await db.auth.admin.listUsers();
  if (list.error) throw list.error;
  const user = list.data.users.find((u) => u.email?.toLowerCase() === env.ALLOWED_EMAIL.toLowerCase());
  if (!user) throw new Error(`No account for ${env.ALLOWED_EMAIL}. Run \`npm run seed\` first.`);

  const password = await askHidden(`New password for ${env.ALLOWED_EMAIL}: `);
  if (password.length < 12) throw new Error("Use at least 12 characters.");
  if ((await askHidden("Type it again: ")) !== password) throw new Error("The two passwords don't match.");

  const { error } = await db.auth.admin.updateUserById(user.id, { password });
  if (error) throw error;
  console.log("Password set. Sign in with it on the login page.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
