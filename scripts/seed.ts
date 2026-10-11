// Loads data/roadmap-seed.json (phases + schedule) into Supabase for ALLOWED_EMAIL's account.
// Safe to re-run: rows are matched on their unique keys and updated, never duplicated.
// New rows start as status 'not_started' / done = false (the column defaults). Progress
// (status / done) and app-only fields (live_url, repo_url, notes) are never sent, so
// re-seeding never resets your work.
// Uses the service role key, so this file must never be imported by the app.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Schedule } from "../src/lib/schedule";

const text = z.string().default("");
const Roadmap = z.object({
  phases: z
    .array(
      z.object({
        number: z.number().int().min(1).max(6),
        title: z.string().min(1),
        role_name: text,
        start_date: z.iso.date(),
        end_date: z.iso.date(),
        summary: text,
        skills: z.array(z.object({ main_skill: z.string().min(1), sub_skills: text })).default([]),
        courses: z
          .array(z.object({ name: z.string().min(1), provider: text, url: text, time_slot: text }))
          .default([]),
        projects: z
          .array(
            z.object({
              rank: z.number().int().positive(),
              name: z.string().min(1),
              problem_solved: text,
              stack: text,
            }),
          )
          .default([]),
        goals: z.array(z.string().min(1)).default([]),
      }),
    )
    .max(6),
  schedule: Schedule,
});

const env = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    ALLOWED_EMAIL: z.email(),
  })
  .parse(process.env);

const path = process.argv[2] ?? "data/roadmap-seed.json";
let raw: string;
try {
  raw = readFileSync(path, "utf8");
} catch {
  throw new Error(`${path} not found. Pass the path to your roadmap JSON: npm run seed -- path/to/file.json`);
}
const roadmap = Roadmap.parse(JSON.parse(raw));

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function check<T>(res: { data: T | null; error: unknown }, what: string): T | null {
  if (res.error) throw new Error(`${what}: ${JSON.stringify(res.error)}`);
  return res.data;
}

async function getOrCreateUserId(email: string): Promise<string> {
  // ponytail: first page only (50 users); fine for a single-user project.
  const list = await db.auth.admin.listUsers();
  if (list.error) throw list.error;
  const { users } = list.data;
  const existing = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) return existing.id;
  const created = await db.auth.admin.createUser({ email, email_confirm: true });
  if (created.error) throw created.error;
  console.log(`Created auth user ${email}`);
  return created.data.user.id;
}

async function main() {
  const userId = await getOrCreateUserId(env.ALLOWED_EMAIL);

  for (const { skills, courses, projects, goals, ...phase } of roadmap.phases) {
    const phaseId = check(
      await db
        .from("phases")
        .upsert({ ...phase, user_id: userId }, { onConflict: "user_id,number" })
        .select("id")
        .single<{ id: string }>(),
      `phase ${phase.number}`,
    )!.id; // .single() errors if no row came back, so this is never null
    const own = { user_id: userId, phase_id: phaseId };

    // No status/done columns in these payloads → existing progress is kept.
    check(await db.from("skills").upsert(skills.map((s) => ({ ...s, ...own })), { onConflict: "phase_id,main_skill" }), "skills");
    check(await db.from("courses").upsert(courses.map((c) => ({ ...c, ...own })), { onConflict: "phase_id,name" }), "courses");
    check(await db.from("projects").upsert(projects.map((p) => ({ ...p, ...own })), { onConflict: "phase_id,rank" }), "projects");
    check(
      await db.from("goals").upsert(goals.map((text) => ({ text, ...own })), { onConflict: "phase_id,text", ignoreDuplicates: true }),
      "goals",
    );

    console.log(
      `Phase ${phase.number}: ${skills.length} skills, ${courses.length} courses, ${projects.length} projects, ${goals.length} goals`,
    );
  }

  check(await db.from("schedule").upsert({ user_id: userId, data: roadmap.schedule }), "schedule");
  console.log(`Schedule: ${roadmap.schedule.class_day_blocks.length} class-day + ${roadmap.schedule.off_day_blocks.length} off-day blocks`);
  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
